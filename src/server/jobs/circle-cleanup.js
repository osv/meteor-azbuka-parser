/*global CircleJobs, Job, console */

Meteor.startup(function() {
  var later = CircleJobs.later;
  var queue;

  CircleJobs.createCleanUpCircleJob = function() {
    var hasJob = CircleJobs.findOne({type: CircleJobs.TYPE_CLEANER_CIRCLES, status: {$ne: 'completed'}});
    if (!hasJob) {
      new Job(CircleJobs, CircleJobs.TYPE_CLEANER_CIRCLES, {}).repeat({
        schedule: later.parse.text('every 1 minutes')
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
      workTimeout: 5 * 60 * 1000
    }, processCleanUp);

    function processCleanUp(job, cb) {
      var current, ids;
      current = new Date();
      current.setMinutes(current.getMinutes() - 2);
      ids = CircleJobs.find({
        status: 'completed',
        updated: {
          $lt: current
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
      job.done('Removed ' + ids.length + ' old jobs');
      return cb();
    }
  };
});
