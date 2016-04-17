/*global Settings */

/*
 * Settings utils
 */

var userAgents = [];

// return random useragent
Settings.getRandomUA = getRandomUA;

setupSettingObserver();


function setupSettingObserver( ) {
  var query = Settings.find({}, {limit: 1});

  query.observeChanges({
    added:   observeSettings,
    changed: observeSettings
  });

  function observeSettings(id, fields) {
    if (fields.userAgent) {
      userAgents = fields.userAgent;
    }
  }
}

function getRandomUA() {
  var res = '';
  if (! _.isEmpty(userAgents)) {
    res = userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  return res;
}
