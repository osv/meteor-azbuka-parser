/*global ReactiveVar, moment, Job, CircleJobs */

const TICK = 2500;
var reactiveDate = new ReactiveVar(new Date());

Template.jobItem.helpers({
  // wrap job into Job (for use actions like "pause", etc)
  wrapJob(job, collectionType) {
    var collection = collectionType === 'circle' ? CircleJobs : null;
    return collection ? Job(collection, job) : null;
  },

  timeFormatter(time) {
    var now;
    now = reactiveDate.get();
    if (Math.abs(time - now) < TICK) {
      return 'Now';
    } else {
      return moment(time).from(now);
    }
  },

  futurePast(time) {
    var now;
    now = reactiveDate.get();
    if (time > now) {
      return 'text-danger';
    } else {
      return 'text-success';
    }
  },

  statusClass(status) {
    return {
      waiting: 'grey',
      ready: 'blue',
      paused: 'black',
      running: 'default',
      cancelled: 'yellow',
      failed: 'red',
      completed: 'green'
    }[status];
  },

  numRepeats(job) {
    return isInfinity(job.repeats);
  },
  numRetries(job) {
    return isInfinity(job.retries);
  },
});

Template.jobControl.helpers({
  cancellable(job) {
    return _.contains(Job.jobStatusCancellable, job.doc.status);
  },
  removable(job) {
    return _.contains(Job.jobStatusRemovable, job.doc.status);
  },
  restartable(job) {
    return _.contains(Job.jobStatusRestartable, job.doc.status);
  },
  pausable(job) {
    return _.contains(Job.jobStatusPausable, job.doc.status);
  },
});

Template.jobControl.events({
  'click .js-job-cancel': jobAction('cancel'),
  'click .js-job-remove': jobAction('remove'),
  'click .js-job-restart': jobAction('restart'),
  'click .js-job-rerun': jobAction('rerun', {wait: 15000}),
  'click .js-job-pause': jobAction('pause'),
  'click .js-job-resume': jobAction('resume'),
  'click .js-job-ready': function(e, t) {
    jobAction('ready', {time: CircleJobs.foreverDate})(e, t);
  },
});

function jobAction(action, options) {
  return function(event, template) {
    var job = Template.currentData().job;
    if (action === 'remove' || action === 'cancel') {
      if (!window.confirm(action + '?')) {
        return;
      }
    }
    if (job) {
      job[action](options);
    }
  };
}

Template.pauseButton.onRendered(handleButtonPopup);
Template.removeButton.onRendered(handleButtonPopup);
Template.resumeButton.onRendered(handleButtonPopup);
Template.restartButton.onRendered(handleButtonPopup);
Template.rerunButton.onRendered(handleButtonPopup);
Template.cancelButton.onRendered(handleButtonPopup);
Template.readyNowButton.onRendered(handleButtonPopup);

Template.pauseButton.onDestroyed(handleDestroyPopup);
Template.removeButton.onDestroyed(handleDestroyPopup);
Template.resumeButton.onDestroyed(handleDestroyPopup);
Template.restartButton.onDestroyed(handleDestroyPopup);
Template.rerunButton.onDestroyed(handleDestroyPopup);
Template.cancelButton.onDestroyed(handleDestroyPopup);
Template.readyNowButton.onDestroyed(handleDestroyPopup);

function handleButtonPopup() {
  this.$('button').tooltip();
}

function handleDestroyPopup() {
  this.$('button').tooltip('destroy');
}

Meteor.setInterval(function() {
  reactiveDate.set(new Date());
}, TICK);

function isInfinity(val) {
  return (val > Job.forever - 7199254740935) ? '∞' : val;
}
