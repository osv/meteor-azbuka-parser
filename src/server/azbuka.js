/*global Errors, Azbuka, Meteor, getSettings, console, JobProfiles, JobImages, Souls, check, Match */

var Iconv = Meteor.npmRequire('iconv').Iconv,
    iconv = new Iconv('cp1251', 'utf8');

var cheerio = Meteor.npmRequire('cheerio');

/* jshint -W020 */

// Azbuka api
Azbuka = {
  logger: console,
  country: '%D3%EA%F0%E0%E8%ED%E0' // украина
};

const SELECTOR_SEARCH_USER_NAME           = 'a.name',
      SELECTOR_SEARCH_USER_IMG            = 'img[src*="users"]',
      SELECTOR_SEARCH_USER_HIDDEN_IMG     = 'img[src*="novisible"]',
      SELECTOR_SEARCH_PAGES_IN_PAGINATION = 'a[href*="file=search"]',
      SELECTOR_PROFILE_IMAGES             = '.maininfo img[src*="users_fotos"]',
      SELECTOR_PROFILE_INVISIBLE          = '.maininfo-photoes img[src*="novisible"]',
      SELECTOR_PROFILE_ONLINE_STATUS      = '.maininfo .maininfo-online-status',
      SELECTOR_PROFILE_OFFLINE_STATUS     = '.maininfo .maininfo-offline-status',
      SELECTOR_PROFILE_AGE_AND_LOCATION   = '.maininfo .maininfo-location',
      SELECTOR_PROFILE_USER_NAME          = '.maininfo .maininfo-name',
      SELECTOR_PROFILE_MAININFO_BLOCK     = '.maininfo';

// store in error log error. Print obj.info
Azbuka.error = function(obj) {
  Errors.insert({
    body: obj
  });
  if (obj.info) {
    this.logger.error('[crawl] ' + obj.info);
  }
  throw new Error('[crawl] ' + obj.info);
};

Azbuka.get = function(url) {
  var raw = Meteor.http.get(url, {
    npmRequestOptions: {
      encoding: null,           // get content as binary data
      responseType: 'buffer'    // get it as a buffer
    }
  }).content;

  var html = iconv.convert(raw).toString();
  return html;
};

Azbuka.parseDate = function(str) {
  // 'foo bar 21 января 2016 23:47'
  var dateStr = str.replace(/.*?(?=\d)/, ''), // remove anything before digirs
      [day, mstr, year, hh, mm] = dateStr.split(/[ :]+/) || [],
      month = [
        'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
      ].findIndex(function(item) {
        var r = new RegExp('^' + item, 'i');
        return r.test(mstr);
      });

  var date = new Date(year, month, day, hh, mm);

  if ( _.isUndefined(day) ||
       month === -1 ||
       _.isUndefined(year) ||
       isNaN(date) ) {

    this.error({
      info: 'Azbuka.parseDate',
      date: str
    });
  }

  return date;
};

Azbuka._newJobImage = function(imageId) {
  return JobImages.upsert(imageId, {
    $setOnInsert: {
      _id: imageId,
      state: JobImages.STATE_WAIT
    }});
};

Azbuka._newSoulItem = function(item) {
  var id = item._id;
  check(item, Match.ObjectIncluding({
    id: String,
    name: String,
    visible: Boolean,
    sex: String
  }));

  var soul = {
    $setOnInsert: _.pick(item, '_id', 'name', 'visible', 'sex'),
    $addToSet: {
      images: item.imageId
    }
  };

  Souls.upsert(id, soul);

  JobProfiles.upsert(id, {
    $setOnInsert: {
      _id: id,
      state: JobProfiles.STATE_WAIT
    }});

  if (item.imageId) {
    this._newJobImage(item.imageId);
  }
};

// Search and add jobs for fetching images and profiles.
// Append souls collection with new soul
//
// Return num of items so if 0 stop crawl next page
Azbuka.search = function(options) {
  let {days, page, sex} = options;

  check(days, Number);
  check(page, Number);
  check(sex, Match.OneOf(['female', 'male']));

  var params = [
    'module=community',
    'file=search',
    'send=ok',
    `country=${this.country}`,
    `days=${days}`,
    `page=${page}`
  ];

  if (sex === 'female') {
    params.push('iseek=%E6%E5%ED%F9%E8%ED%F3');
  } else {
    params.push('%EC%F3%E6%F7%E8%ED%F3');
  }

  var url = 'http://azbyka.ru/znakomstva/index.php?' + params.join('&');
  this.logger.log('Fetching ' + url);

  var html = this.get(url);

  var $ = cheerio.load(html);

  // TODO page should contain 20 items, warn if not
  var items = [];

  $('table td').each(function(i, elem) {
    var $e = $(this);
    var image = $e.find(SELECTOR_SEARCH_USER_IMG).attr('src'),
        isVisible = !! $e.find(SELECTOR_SEARCH_USER_HIDDEN_IMG).length,
        a = $e.find(SELECTOR_SEARCH_USER_NAME),
        name = a.text(),
        anketaLink = a.attr('href');

    var id = (anketaLink || '').replace(/^.*\//, '');

    if (! name || !id) {
      this.error({
        info: 'Azbuka.fetch. Item w/o name or id, check html',
        html: $e.innerHTML,
      });
    }

    var imageId;
    if (image) {
      imageId = image.replace(/^.*\//, '');
    }

    items.push({
      _id: id,
      name: name,
      visible: isVisible,
      image: imageId,
      sex: sex
    });
  });

  // does it this page have "следующая" link, if so, and items is less 20 warn
  var isNextPage = _.find($(SELECTOR_SEARCH_PAGES_IN_PAGINATION), function($el) {
    return ($el.innerText || '').match(/следующая/);
  });

  if (items.length !== 20 && isNextPage) {
    this.error({
      info: `Azbuka.fetch. Azbuka page have ${items.length} items but should 20, check HTML!`,
      html: html
    });
  }

  return items;
};

/*
 * Fetch user  profile. Add images jobs.
 * Return Object or null if not foun. Object:
 * {
 *  invisibleImages: Boolean // True - Hidden profile
 *                           // You should download this with options.authorized  true
 *  numOfImages: Number  // number of images (even if invisibleImages is true)
 *  images: [String],
 *  name: String,
 *  loc: String,
 *  age: Number,
 *  views: Number,
 *  maininfo: String  // Html version of main info,
 *  lastSeen: Date,
 *  about: [Object] } // Key-value of about section
 */
Azbuka.getProfile = function(options) {
  var self = this;

  var ERROR_TYPE = '[Azbyka.getProfile]';

  check(options, Match.ObjectIncluding({
    azbukaProfile: String,
    authorized: Boolean
  }));

  var {azbukaProfile, authorized} = options;

  if (!azbukaProfile.match(/\w+_\d+/)) {
    self.error({
      info: `${ERROR_TYPE} Profile id strange! it should be Zyx_124`,
      profileId: azbukaProfile
    });
  }

  var html;

  const url = 'http://azbyka.ru/znakomstva/anketa/' + azbukaProfile;
  console.log(url);


  if (authorized) {
    // download with auth
  } else {
    html = this.get(url);
    // just fetch
  }

  if (html.match(/Анкета не найдена/i)) {
    return null;
  }

  var $ = cheerio.load(html);

  var maininfo = $(SELECTOR_PROFILE_MAININFO_BLOCK);
  if (! maininfo.length) {
    self.error({
      info: `${ERROR_TYPE} .maininfo not found`,
      profileId: azbukaProfile
    });
    return null;
  }

  // name
  var pName = $(SELECTOR_PROFILE_USER_NAME).text();

  // age, location
  var [, ageStr, ...pLocation] = $(SELECTOR_PROFILE_AGE_AND_LOCATION).text().split(/\s*,\s*/);
  var pAge = +ageStr.replace(/\D/g, ''); // extract digits

  if (_.isEmpty(pLocation)) {
    self.error({
      info: `${ERROR_TYPE} .maininfo-location have no valid location`,
      profileId: azbukaProfile,
      location: pLocation,
      html: html
    });
  }
  pLocation = pLocation.join('/');

  if (!pAge) {
    self.error({
      info: `${ERROR_TYPE} .maininfo-location have no valid age`,
      profileId: azbukaProfile,
      ageStr: ageStr,
      html: html
    });
  }

  // images
  var pImages = [];

  $(SELECTOR_PROFILE_IMAGES).each(function(i, e) {
    let url = $(this).attr('src') || '';
    let imageId = url.replace(/^.*\//, '');
    pImages.push(imageId);
  });

  // num of views
  var pViews;
  if (html.match(/просмотров анкеты:\s(\d+)/)) {
    pViews = RegExp.$1;
  }

  // lastSeen date
  var pLastseen = _.isEmpty($(SELECTOR_PROFILE_ONLINE_STATUS)) ?
        self.parseDate($(SELECTOR_PROFILE_OFFLINE_STATUS).text())
        : new Date();

  var pHasInvisibleImages = $(maininfo).find(SELECTOR_PROFILE_INVISIBLE).length;
  var pNumOfImages = pImages.length;
  if (pHasInvisibleImages) {
    let matches = html.match(/file=login">\s*(\d+)\s*фото<\/a>/i);
    if (!matches) {
      self.error({
        info: `${ERROR_TYPE} Profile have hidden images but cant find count`,
        desc: 'Looks here no url \"<a href="/znakomstva/index.php?module=community&amp;file=login">123 фото</a>\"',
        profileId: azbukaProfile,
      });
    }
    pNumOfImages = matches[1];   // \d+
  }

  var pAbout = {};
  $('.about-item').each(function() {
    var el = $(this).clone();
    var type = el.find('.about-type').first().text();
    var value = el.remove('.about-type').find('.about-text').text();

    if (! type) {
      self.error({
        info: `${ERROR_TYPE} Expected .about-type`,
        html: $(this).html(),
        profileId: azbukaProfile
      });
    }

    if (type.indexOf('Рост') !== -1 ||
        type.indexOf('Вес') !== -1) {
      var [, height] = value.match(/Рост:\s+(\d+)/i) || [];
      if (height) {
        pAbout['Рост'] = +height;
      }
      var [, weight] = value.match(/Вес:\s+(\d+)/i) || [];
      if (weight) {
        pAbout['Вес'] = +weight;
      }
      return;
    }

    if (type.indexOf('Вероисповедание') !== -1) {
      pAbout['Вероисповедание'] = sanitize(value.replace(/пояснение[^]*/i, ''));
      return;
    }

    type = type.replace(/:$/, '');
    type = type.replace(/\n|\\n/g, '');
    type = type.replace(/^\s+|\s+$/g, '');
    pAbout[type] = sanitize(value);

    function sanitize(value) {
      value = value.replace(/\n|\\n/g, '');
      value = value.replace(/^\s+|\s+$/g, '');
      return value;
    }
  });

  var profile = {
    images: pImages,
    name: pName,
    loc: pLocation,
    age: pAge,
    views: pViews,
    maininfo: maininfo.html(),
    lastSeen: pLastseen,
    about: pAbout,
    invisibleImages: pHasInvisibleImages,
    numOfImages: pNumOfImages
  };
  return profile;
};

var profile = Azbuka.getProfile({
  azbukaProfile: 'zlata_99808',
  authorized: false
});


//var profile = Azbuka.search({days: 4, page: 0});
console.log(profile);
//Ольга, 26 лет, Россия, Санкт-Петербург и область, Санкт-Петербург
