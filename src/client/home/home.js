/* global Template, ReactiveVar */

var isActive = new ReactiveVar(false);
var showLogin = new ReactiveVar(false);

Template.home.events({
  'click [data-action="tglLogin"]': function() {

    isActive.set(! isActive.get());

    Meteor.setTimeout(function() {
      showLogin.set(! showLogin.get());
    }, 600);
  },

  'click [data-action="logout"]': function() {
    Meteor.logout();
  },
});

Template.home.helpers({
  username() {
    let user = Meteor.user(),
        profile = user.profile || {};
    return user.username || profile.name;
  },
  showLogin() {
    return showLogin.get();
  },

  animateClass() {
    return isActive.get() ? 'fadeIn' : 'fadeOut';
  },

  isActive() {
    return isActive.get() ? 'active' : '';
  }
});
