/*global CircleJobs, ReactiveVar, moment */

var rvEditJob = new ReactiveVar();

Template.control.helpers({
  getJobData() {
    return rvEditJob.get();
  }
});

var rvShowAllCircleJob = new ReactiveVar();
// Job control
Template.circleJobControl.helpers({
  circleJobs() {
    var showAll = rvShowAllCircleJob.get(),
        query = showAll ? {} : {status: {$ne: 'completed'}};
    return CircleJobs.find(query, {sort: {type: 1, updated: -1}});
  },

  isShowAllCircleJobs() { return rvShowAllCircleJob.get(); },
});

Template.circleJobControl.events({
  'click .js-create-scanner'() {
    Meteor.call('createUpdaterJob');
  },
  'click .js-create-cleaner'() {
    Meteor.call('createCleanUpJob');
  },
  'click .js-show-all-circle-jobs'() {
    rvShowAllCircleJob.set(!rvShowAllCircleJob.get());
  },
  'click .js-edit-job'(e) {
    rvEditJob.set({
      collection: 'circle',
      jobId: e.currentTarget.id
    });
  }
});
