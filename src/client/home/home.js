/* global Template, ReactiveVar */

var isActive = new ReactiveVar(false);
Template.home.events({
  'click [data-action="tglLogin"]': function() {
    console.log('zzzzzzzz');

    isActive.set(! isActive.get());
  }
});

Template.home.helpers({
  isActive() {
    return isActive.get() ? 'active' : '';
  }
});
