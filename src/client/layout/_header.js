Template.header.helpers({
  username() {
    let user = Meteor.user(),
        profile = user.profile || {};
    return user.username || profile.name;
  },
});

Template.header.events({
  'click [data-action="logout"]': function() {
    Meteor.logout();
  },
});
