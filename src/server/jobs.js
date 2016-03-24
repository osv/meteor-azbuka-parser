/*global CircleJobs, Acl */

Meteor.publish('circleJobs', function () {
  if (Acl.isAdminById(this.userId)) {
    return CircleJobs.find({});
  }
  return [];
});

Meteor.startup(function () {
  // Grant full permission to admin
  CircleJobs.allow({
    admin: Acl.isAdminById
  });

  // ensure jobs exists
  CircleJobs.createUpdateJob();
  CircleJobs.createCleanUpCircleJob();

  // run worker on this node
  CircleJobs.startCleanupWorker();
  CircleJobs.startUpdaterWorker();

  // Start the myJobs queue running
  CircleJobs.startJobServer();
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
  }
});
