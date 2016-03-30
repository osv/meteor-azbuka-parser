/*global CircleJobs, Acl, FetchJobs, check */

Meteor.publish('circleJobs', function () {
  if (Acl.isAdminById(this.userId)) {
    return CircleJobs.find({});
  }
  return [];
});

Meteor.publish('fetchJobs', function () {
  if (Acl.isAdminById(this.userId)) {
    return FetchJobs.find({});
  }
  return [];
});

Meteor.startup(function () {
  // Grant full permission to admin
  CircleJobs.allow({
    admin: Acl.isAdminById
  });

  FetchJobs.allow({
    admin: Acl.isAdminById
  });

  // ensure jobs exists
  CircleJobs.createUpdateJob();
  CircleJobs.createCleanUpCircleJob();

  // run worker on this node
  CircleJobs.startCleanupWorker();
  CircleJobs.startUpdaterWorker();
  FetchJobs.startProfileWorker();

  // Start the myJobs queue running
  CircleJobs.startJobServer();
  FetchJobs.startJobServer();
});

Meteor.methods({
  createUpdaterJob() {
    if (Acl.isAdminById(this.userId)) {
      CircleJobs.createUpdateJob();
    }
  },
  createCleanUpCircleJob() {
    if (Acl.isAdminById(this.userId)) {
      CircleJobs.createCleanUpCircleJob();
    }
  },
  createNewProfileJobs(profilesAsText) {
    check(profilesAsText, String);

    profilesAsText.split(/[, ]+/).map(function(s) {
      var profileId = s.trim();
      if (profileId) {
        FetchJobs.createProfileJob(profileId);
      }
    });
  }
});
