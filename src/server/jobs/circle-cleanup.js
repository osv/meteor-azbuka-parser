/*global CircleJobs, Job, console */

Meteor.startup(function() {
  var later = CircleJobs.later;
  var queue;

  CircleJobs.createCleanUpJob = function() {
    if (!CircleJobs.findOne({type: 'cleanup', status: {$ne: 'completed'}})) {
      new Job(CircleJobs, 'cleanup', {}).repeat({
        schedule: later.parse.text('every 1 minutes')
      }).save({
        cancelRepeats: true
      });
      console.log('Created scheduled clean job');
    }
  };

  CircleJobs.startCleanupWorker = function() {
    queue = CircleJobs.processJobs('cleanup', {
      workTimeout: 60 * 1000
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
