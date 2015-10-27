/* globals ServiceConfiguration, process */

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
