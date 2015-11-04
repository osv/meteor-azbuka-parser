/* globals Router */

Router.configure({
  layoutTemplate: 'appLayout',
  notFoundTemplate: 'notFound',
  subscriptions() {
    return Meteor.subscribe('userData');
  }
});
