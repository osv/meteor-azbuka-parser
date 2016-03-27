/*global CircleJobs, ReactiveVar, FetchJobs */

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
    Meteor.call('createCleanUpCircleJob');
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

// Fetch control
Template.fetchJobControl.onCreated(function() {
  this.rvShowAll = new ReactiveVar();
  this.rvShowAddJob = new ReactiveVar();
});

Template.fetchJobControl.helpers({
  jobs() {
    var showAll = Template.instance().rvShowAll.get(),
        query = showAll ? {} : {status: {$ne: 'completed'}};
    return FetchJobs.find(query, {sort: {type: 1, updated: -1}});
  },

  isShowAll() { return Template.instance().rvShowAll.get(); },
  isShowAddJob() { return Template.instance().rvShowAddJob.get(); },
});

Template.fetchJobControl.events({
  'click .js-toggle-add-jobs'() {
    var r = Template.instance().rvShowAddJob;
    r.set(!r.get());
  },
  'click .js-show-all-jobs'() {
    var r = Template.instance().rvShowAll;
    r.set(!r.get());
  },
  'click .js-edit-job'(e) {
    rvEditJob.set({
      collection: 'fetch',
      jobId: e.currentTarget.id
    });
  },
  'keypress .js-profiles-input'(e) {
    if (e.charCode === 13) {
      let profilesAsText = e.currentTarget.value;
      Meteor.call('createNewProfileJobs', profilesAsText);
      e.currentTarget.value = '';
    }
  }
});
