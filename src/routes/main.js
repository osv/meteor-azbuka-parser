/* globals Router, SEO */

Router.route('/', {
  name: 'home',
  layoutTemplate: 'landing',
  action: function () {
    this.render('home');
    SEO.set({title: 'Home - ' + Meteor.App.NAME});
  }
});
