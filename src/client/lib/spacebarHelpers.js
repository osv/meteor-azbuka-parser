/* global Template */

Template.registerHelper('constant', function (what) {
  return Meteor.App[what.toUpperCase()];
});
