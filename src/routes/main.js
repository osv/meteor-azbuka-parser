/* globals Router, SEO, Settings, RouteController, AdminController:true, AuthController:true */

Router.route('/', {
  name: 'home',

  layoutTemplate: 'landing',

  action: function () {
    this.render('home');
    SEO.set({title: 'Home - ' + Meteor.App.NAME});
  }
});

AuthController = RouteController.extend({
  onBeforeAction() {
    if (!Meteor.user()) {
      return this.redirect('home');
    }
    this.next();
  }
});

AdminController = AuthController.extend({
  onBeforeAction() {
    let user = Meteor.user();
    // Meteor
    // if (! user || ! user.isAdmin) {
    //   return this.redirect('home');
    // }
    this.next();
  }
});

Router.route('/settings', {
  name: 'settings',

  subscriptions() {
    return Meteor.subscribe('setting');
  },

  controller: 'AdminController',

  data() {
    SEO.set({title: 'Settings - ' + Meteor.App.NAME});
    return Settings.findOne();
  }
});

Router.route('/control', {
  name: 'control',

  controller: 'AdminController',

  data() {
    SEO.set({title: 'Control - ' + Meteor.App.NAME});
    return Settings.findOne();
  }
});
