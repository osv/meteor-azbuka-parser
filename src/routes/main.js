/* globals Router, SEO, Settings */

Router.route('/', {
  name: 'home',
  layoutTemplate: 'landing',
  action: function () {
    this.render('home');
    SEO.set({title: 'Home - ' + Meteor.App.NAME});
  }
});

Router.route('/settings', {
  name: 'settings',
  subscriptions() {
    return Meteor.subscribe('allSetting');
  },

  data() {
    SEO.set({title: 'Settings - ' + Meteor.App.NAME});
    return Settings.findOne();
  }
});
