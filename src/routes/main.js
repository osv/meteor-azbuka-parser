/*global Router, SEO, Settings, RouteController, AdminController:true, AuthController:true */
/*global ErrorsPages, Errors, Acl*/
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
    //let user = Meteor.user();
    // Meteor
    // if (! user || ! user.isAdmin) {
    //   return this.redirect('home');
    // }
    this.next();
  }
});

Router.route('/admin/settings', {
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

Router.route('/admin/control', {
  name: 'control',

  controller: 'AdminController',

  subscriptions() {
    return [
      Meteor.subscribe('circleJobs'),
      Meteor.subscribe('fetchJobs')
    ];
  },

  data() {
    SEO.set({title: 'Control - ' + Meteor.App.NAME});
  }
});

/* jshint -W020 */
ErrorsPages = new Meteor.Pagination(Errors, {
  auth: Meteor.isClient ? function(){} : function(skip, subscription) {
    return Acl.isAdminById(subscription.userId);
  },
  perPage: 20,
  templateName: 'adminErrors',
  router: 'iron-router',
  homeRoute: '/admin/errors',
  route: '/admin/errors/',
  routerTemplate: 'adminErrors',
  routerLayout: 'appLayout',
  itemTemplate: 'adminError',
  divWrapper: '',
  resetOnReload: true,
  pageSizeLimit: 100,
  sort: {createdAt: -1},
});
