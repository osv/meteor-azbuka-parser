/*global Job, CircleJobs, Acl, console */

var later = CircleJobs.later;

if (Meteor.isServer) {
  Meteor.startup(function() {
    // Grant full permission to admin
    CircleJobs.allow({
      admin: Acl.isAdminById
    });
  });
}

// create scheduled job if not exist
if (!CircleJobs.findOne({type: 'cleanup'})) {
  console.log('Created cleanup job');
  createCleanUpJob();
}

// create scheduled job if not exist
if (!CircleJobs.findOne({type: 'runScanner'})) {
  console.log('Created scheduled job');
  createUpdateJob();
}

Meteor.publish('circleJobs', function () {
  if (Acl.isAdminById(this.userId)) {
    return CircleJobs.find({});
  }
  return [];
});

Meteor.startup(function () {
  startCleanup();
  startUpdater();

  // Start the myJobs queue running
  CircleJobs.startJobServer();
});

function createCleanUpJob() {
  new Job(CircleJobs, 'cleanup', {}).repeat({
    schedule: later.parse.text('every 1 minutes')
  }).save({
    cancelRepeats: true
  });
}

function startCleanup() {
  var queue = CircleJobs.processJobs('cleanup', {
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
    console.log('Removed ' + ids.length);

    job.done('Removed ' + ids.length + ' old jobs');
    return cb();
  }
}

// create job for cleaning completed jobs in CircleJobs collection
function createUpdateJob() {
  var job = new Job(CircleJobs, 'runScanner', {}),
      schedule = later.parse.text('every 1 minutes');

  job.priority('normal')
    .repeat({schedule: schedule})
    .save();               // Commit it to the server
}

// azbuka profile update
function startUpdater() {
  var queue = CircleJobs.processJobs('runScanner', {
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
}
