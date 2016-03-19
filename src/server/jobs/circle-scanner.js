/*global CircleJobs, Job*/

Meteor.startup(function() {
  var later = CircleJobs.later;
  var queue;

  // create job for cleaning completed jobs in CircleJobs collection
  CircleJobs.createUpdateJob = function() {
    // create scheduled job if not exist
    if (!CircleJobs.findOne({type: 'runScanner'})) {
      let job = new Job(CircleJobs, 'runScanner', {}),
          schedule = later.parse.text('every 1 minutes');

      job.priority('normal')
        .repeat({schedule: schedule})
        .save();
      console.log('Created scheduled job');
    }
  };

  // azbuka profile update
  CircleJobs.startUpdaterWorker = function() {
    queue = CircleJobs.processJobs('runScanner', {
      workTimeout: 30 * 60 * 1000,
    }, worker);

    function worker(job, callback) {
      // Only called when there is a valid job
      console.log('processing job', job.doc._id);
      Meteor._sleepForMs(1000);
      console.log('finish job', job.doc._id);

      job.done();
      callback();
    }

    CircleJobs.find({
      type: 'runScanner',
    }).observe({
      changed: function(id, doc) {
        console.log('changed', doc._id, doc.status);
      }
    });
  };
});
