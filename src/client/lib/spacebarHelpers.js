/*global Template, Acl */

Template.registerHelper('constant', function (what) {
  return Meteor.App[what.toUpperCase()];
});

Template.registerHelper('isAdmin', function () {
  return Acl.isAdmin();
});

Template.registerHelper('eq', function (a, b) {
  /* jshint -W116 */
  return a == b;
});
