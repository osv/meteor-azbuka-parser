/* globals ServiceConfiguration, process, Accounts */

Meteor.startup(function() {
  let env = process.env;

  // Add Google configuration entry
  ServiceConfiguration.configurations.update(
    {service: 'google'},
    {
      $set: {
        clientId: env.GOOGLE_ID,
        client_email: env.GOOGLE_EMAIL,
        secret: env.GOOGLE_SECRET,
      }
    },
    {upsert: true}
  );

  // facebook
  ServiceConfiguration.configurations.update(
    {service: 'facebook'},
    {
      $set: {
        appId: env.FACEBOOK_ID,
        secret: env.FACEBOOK_SECRET
      }
    },
    {upsert: true}
  );

});

Accounts.onCreateUser(function (options, user) {
  let anyUser = Meteor.users.findOne();

  if (! anyUser) {
    user.isAdmin = true;
  }

  user.profile = options.profile;
  return user;
});

Meteor.publish('userData', function () {
  return Meteor.users.find({_id: this.userId}, {
    fields: {
      isAdmin: 1,
    }});
});
