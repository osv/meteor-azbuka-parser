/*global Meteor, Settings, Acl */

Meteor.publish('setting', function() {
  var options = {
    limit: 1,
  };

  if (! Acl.isAdminById(this.userId)) {
    options.fields = Settings.PUBLIC_FIELDS;
  }

  return Settings.find();
});
