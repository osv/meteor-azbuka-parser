/*global Errors, Azbuka, Meteor, console, JobProfiles, JobImages */
/*global Souls, check, Match, syncRequest, Settings */


var Iconv = Meteor.npmRequire('iconv').Iconv,
    iconv = new Iconv('cp1251', 'utf8');

var cheerio = Meteor.npmRequire('cheerio');

/* jshint -W020 */

// Azbuka api
Azbuka = {
  logger: console,
  cookieJar: syncRequest.jar(),
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

// Fetch @uri. Set @useCookie to true for use cookie
Azbuka.get = function(url, useCookie) {
  var options = {
    headers: {
      'User-Agent': Settings.getRandomUA()
    },
    encoding: null,           // get content as binary data
    responseType: 'buffer'    // get it as a buffer
  };

  if (useCookie) {
    options.jar = this.cookieJar;
  }

  var raw = syncRequest.get(url, options).content;

  var html = iconv.convert(raw).toString();
  return html;
};

Azbuka.login = function(login, password) {
  var loginUrl = 'http://azbyka.ru/znakomstva/index.php?module=community&file=login';
  var ERROR_TYPE = '[Azbyka.login]';

  var credential = {
    login: login,
    password: password
  };

  var res = syncRequest.post(loginUrl, {
    form: _.extend({send: 'ok'}, credential),
    encoding: null,           // get content as binary data
    responseType: 'buffer',   // get it as a buffer
    jar: this.cookieJar,
  });

  if (res.statusCode !== 302) {
    this.error({
      info: `${ERROR_TYPE} Expected status 302, but got "${res.statusCode}"`,
      usedLogin: login
    });
  }
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

/**
 * Fetch new profiles
 *
 * @param {Object} options
 * @param {Number} options.days - how far to search
 * @param {Number} options.page - page of search result
 * @param {String} sex - 'female' or 'male'. There no other way
 * to get sex from azbuka profile, so need to fetch separately.
 *
 * @returns {Object[]} profiles - basic profile object
 * @returns {String} profiles[]._id
 * @returns {String} profiles[].name
 * @returns {Boolean} profiles[].isVisible - does profile hidden or not
 * @returns {String} profiles[].image - main profile avatar/img
 * @returns {String} profiles[].sex - just copied value from options.sex
 */
Azbuka.search = function(options) {
  let self = this;
  let {days, page, sex} = options;

  check(days, Number);
  check(page, Number);
  check(sex, Match.OneOf('female', 'male'));

  var params = [
    'module=community',
    'file=search',
    'send=ok',
    `country=${this.country}`,
    `days=${days}`,
    `off=${page}`
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

  var dataTableSelector = '#content table td';
  var dataTable = $(dataTableSelector);
  // return if np items
  if (dataTable.text().match(/запрос не дал результатов/i)) {
    return [];
  }

  if (!dataTable.length) {
    self.error({
      info: `Azbuka.fetch. No content "${dataTableSelector}"`,
      html: html,
    });
  }

  dataTable.each(function(i, elem) {
    var $e = $(this);
    var image = $e.find(SELECTOR_SEARCH_USER_IMG).attr('src'),
        isVisible = !! $e.find(SELECTOR_SEARCH_USER_HIDDEN_IMG).length,
        a = $e.find(SELECTOR_SEARCH_USER_NAME),
        name = a.text(),
        anketaLink = a.attr('href');

    var id = (anketaLink || '').replace(/^.*\//, '');

    if (! name || !id) {
      self.error({
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
    self.error({
      info: `Azbuka.fetch. Azbuka page have ${items.length} items but should 20, check HTML!`,
      html: html
    });
  }

  return items;
};

/**
 * Fetch user  profile.
 *
 * @param {Object} options
 * @param {String} options.azbukaProfile profile Id
 * @param {Boolean} options.authorized Profile is hidden and should use authorization for getting images info
 *
 * @returns {null|Object} profile - profile object or null if have problems
 * @returns {Boolean} profile.invisibleImages - true if hidden profile.
 * @returns {Boolean} profile.invisiblImage4Request - true if hidden profile and you need request friend to see photo.
 * @returns {Number} profile.numOfImages
 * @returns {String[]} profile.images
 * @returns {String} profile.name
 * @returns {String} profile.loc - location text
 * @returns {Number} profile.age
 * @returns {Number} profile.views
 * @returns {Date} profile.lastSeen
 * @returns {Object[]} profile.about - key-value of aobut section
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

  html = this.get(url, authorized);

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
  var pViews = 0;
  if (html.match(/просмотров анкеты:\s(\d+)/)) {
    pViews = RegExp.$1;
  }

  // lastSeen date
  var pLastseen = _.isEmpty($(SELECTOR_PROFILE_ONLINE_STATUS)) ?
        self.parseDate($(SELECTOR_PROFILE_OFFLINE_STATUS).text())
        : new Date();

  var pHasInvisibleImages = !!$(maininfo).find(SELECTOR_PROFILE_INVISIBLE).length;
  var pHasInvisiblImage4Request = !!html.match(/фото доступен только для избранников этого участника/i);
  var pNumOfImages = pImages.length;
  if (pHasInvisiblImage4Request || pHasInvisibleImages) {
    let matches = html.match(/file=login>\s*(\d+)\s*фото<\/a>/i) ||
          html.match(/scrollbars=yes'\)">\s*(\d+)\s*фото<\/a>/i) || // dima_167123
          html.match(/>\s*(\d+)\s*фото<\/a>/i);
    if (!matches) {
      self.error({
        info: `${ERROR_TYPE} Profile have hidden images but cant find count`,
        desc: 'Looks here no url \"<a href="/znakomstva/index.php?module=community&amp;file=login">123 фото</a>\"',
        html: html,
        profileId: azbukaProfile,
      });
    }
    pNumOfImages = matches[1];   // \d+
  }

  var pAbout = {},
      pTestRate = 0;
  $('.about-item').each(function() {
    var el = $(this).clone();
    var elText = el.text();
    var type = el.find('.about-type').first().text();
    var value = el.remove('.about-type').find('.about-text').text();

    if (! type) {
      self.error({
        info: `${ERROR_TYPE} Expected .about-type`,
        html: $(this).html(),
        profileId: azbukaProfile
      });
    }

    var [, testRate, testQuestions] = elText.match(/(\d+)%\s+из\s+(\d+)\s+вопрос/) || [];
    if (testRate) {
      pTestRate = testRate;
      pAbout['Test rate (%)'] = testRate;
      pAbout['Tests'] = testQuestions;
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
    age: +pAge,
    views: +pViews,
    maininfo: maininfo.html(),
    lastSeen: pLastseen,
    testRate: pTestRate,
    about: pAbout,
    invisibleImages: pHasInvisibleImages,
    invisiblImage4Request: pHasInvisiblImage4Request,
    numOfImages: pNumOfImages
  };
  return profile;
};

// console.log('last 4 days', Azbuka.search({days: 4, page: 2, sex: 'male'}));

// console.log('authiruzed', Azbuka.getProfile({
//   azbukaProfile: 'viktorija_138093',
//   authorized: true,
// }));

// Azbuka.login('xxx', 'yy');

// console.log('authiruzed', Azbuka.getProfile({
//   azbukaProfile: 'zlata_99808',
//   authorized: true,
// }));

// console.log('----------');
// console.log(Azbuka.getProfile({
//   azbukaProfile: 'zlata_99808',
//   authorized: false,
// }));
