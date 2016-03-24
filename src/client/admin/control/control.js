/*global CircleJobs, ReactiveVar */

var rvEditJob = new ReactiveVar();

Template.control.helpers({
  getJobData() {
    return rvEditJob.get();
  }
});

// Job control
Template.circleJobControl.onCreated(function() {
  this.rvShowAll = new ReactiveVar();
});

Template.circleJobControl.helpers({
  jobs() {
    var showAll = Template.instance().rvShowAll.get(),
        query = showAll ? {} : {status: {$ne: 'completed'}};
    return CircleJobs.find(query, {sort: {type: 1, updated: -1}});
  },

  isShowAll() { return Template.instance().rvShowAll.get(); },
});

Template.circleJobControl.events({
  'click .js-create-scanner'() {
    Meteor.call('createUpdaterJob');
  },
  'click .js-create-cleaner'() {
    Meteor.call('createCleanUpJob');
  },
  'click .js-show-all-jobs'() {
    var r = Template.instance().rvShowAll;
    r.set(!r.get());
  },
  'click .js-edit-job'(e) {
    rvEditJob.set({
      collection: 'circle',
      jobId: e.currentTarget.id
    });
  }
});
