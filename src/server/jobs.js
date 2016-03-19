/*global Job, CircleJobs, Acl, console */

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
  CircleJobs.createCleanUpJob();

  // run worker on this node
  CircleJobs.startCleanupWorker();
  CircleJobs.startUpdaterWorker();

  // Start the myJobs queue running
  CircleJobs.startJobServer();
});

Meteor.methods({
  createUpdaterJob() {
    console.log('x1');

    if (Acl.isAdminById(this.userId)) {
      console.log('x2');

      CircleJobs.createUpdateJob();
    }
  },
  createCleanUpJob() {
    if (Acl.isAdminById(this.userId)) {
      CircleJobs.createCleanUpJob();
    }
  }
});
