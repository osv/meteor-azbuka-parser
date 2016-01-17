/*global Settings, console */

if (! Settings.findOne()) {
  bootstrapSetting();
}

function bootstrapSetting() {
  var obj = {};
  console.log('No settings found, I set default settings for you.');

  Settings.insert(obj);
}
