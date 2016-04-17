/*global CircleJobs, FetchJobs, Job, console */

Meteor.startup(function() {
  var later = CircleJobs.later;
  var queue;

  CircleJobs.createCleanUpCircleJob = function() {
    var hasJob = CircleJobs.findOne({type: CircleJobs.TYPE_CLEANER_CIRCLES, status: {$ne: 'completed'}});
    if (!hasJob) {
      new Job(CircleJobs, CircleJobs.TYPE_CLEANER_CIRCLES, {}).repeat({
        schedule: later.parse.text('every 3 hours')
      })
        .retry({
          retries: 1,
          wait: 15 * 60 * 1000})  // 15 minutes between attempts
        .save({
        cancelRepeats: true
      });
      console.log('Created scheduled clean job');
    }
  };

  CircleJobs.startCleanupWorker = function() {
    queue = CircleJobs.processJobs(CircleJobs.TYPE_CLEANER_CIRCLES, {
      workTimeout: 15 * 60 * 1000
    }, processCleanUp);

    function processCleanUp(job, cb) {
      var removedCircle = removeOldCircleJobs();
      var removedFetch =  removeOldFetchJobs();
      job.done(`Removed ${removedCircle} circle jobs and ${removedFetch} jobs`);
      return cb();
    }

    function removeOldCircleJobs() {
      var time = new Date();
      time.setTime(time.getTime() - 3 * 24 * 60 * 60 * 1000);
      var ids = CircleJobs.find({
        status: 'completed',
        updated: {
          $lt: time
        }
      }, {
        fields: {
          _id: 1
        }
      }).map(function(d) {
        return d._id;
      });

      if (ids.length > 0) {
        CircleJobs.removeJobs(ids);
      }
      return ids.length;
    }

    function removeOldFetchJobs(arg) {
      var time = new Date();
      time.setTime(time.getTime() - 7 * 24 * 60 * 60 * 1000);
      var ids = FetchJobs.find({
        status: 'completed',
        updated: {
          $lt: time
        }
      }, {
        fields: {
          _id: 1
        }
      }).map(function(d) {
        return d._id;
      });

      if (ids.length > 0) {
        FetchJobs.removeJobs(ids);
      }
      return ids.length;
    }
  };
});
