/*global Azbuka, Meteor, getSettings, console, JobProfiles, JobImages, Souls, check */

var Iconv = Meteor.npmRequire('iconv').Iconv,
    iconv = new Iconv('cp1251', 'utf8');

var cheerio = Meteor.npmRequire('cheerio');


/* jshint -W020 */

// Azbuka api
Azbuka = {
  baseUrl: 'http://azbyka.ru/znakomstva/index.php',
  logger: console,
};

// Return num of items
Azbuka.search = function(options) {
  let {days, page} = options;

  check(days, Number);
  check(page, Number);
  var settings = getSettings();
  var params = [
    'module=community',
    'file=search',
    'send=ok',
    'country=%D3%EA%F0%E0%E8%ED%E0', // украина
    `days=${days}`,
    `page=${page}`
  ];

  if (settings.sex == 'female') {
    params.push('iseek=%E6%E5%ED%F9%E8%ED%F3');
  } else if (settings.sex == 'male') {
    params.push('%EC%F3%E6%F7%E8%ED%F3');
  }

  var url = this.baseUrl + '?' + params.join('&');
  this.logger.log('Fetching ' + url);

  var html = this.get(url);

  var $ = cheerio.load(html);

  // TODO page should contain 20 items, warn if not
  var items = 0;
  $('table td').each(function(i, elem) {
    items++;
    var $e = $(this);
    var image = $e.find('img[src*="users"]').attr('src'),
        isVisible = !! $e.find('img[src*="novisible"]').length,
        a = $e.find('a.name'),
        name = a.text(),
        anketaLink = a.attr('href');

    var id = (anketaLink || '').replace(/^.*\//, '');

    if (! name || !id) {
      Errors.inset({body: {
        info: 'Azbuka.fetch. Item w/o name or id, check html',
        html: $e.innerHTML,
      }});
    }


    var imageId;
    if (image) {
      imageId = image.replace(/^.*\//, '');
    }

    if (imageId) {
      JobImages.upsert(imageId, {
        $setOnInsert: {
          _id: imageId,
          state: JobImages.STATE_WAIT
        }});
    }

    var soul = {
      $setOnInsert: {
        _id: id,
        name: name,
        visible: isVisible
      },
      $addToSet: {
        images: imageId
      }
    };

    // Errors
    Souls.upsert(id, soul);

    JobProfiles.upsert(id, {
      $setOnInsert: {
        _id: id,
        state: JobProfiles.STATE_WAIT
      }});

  });

  // does it this page have "следующая" link, if so, and items is less 20 warn
  var isNextPage = _.find($('a[href*="file=search"]'), function($el) {
    return ($el.innerText || '').match(/следующая/);
  });

  if (!items < 20) {
    this.logger.warn('Azbuka page have < 20 items, maybe redesigned?');
    Errors.insert({body: {
      info: 'Azbuka.fetch. Azbuka page have < 20 items, check HTML',
      html: html
    }});
  }

  return items;
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

//Azbuka.search({days: 4, page: 0});
