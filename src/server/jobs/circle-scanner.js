/*global CircleJobs, FetchJobs, Job, getSettings, Souls, Azbuka, console, Settings */

Meteor.startup(function() {
  var later = CircleJobs.later;
  var queue;

  // create job for cleaning completed jobs in CircleJobs collection
  CircleJobs.createUpdateJob = function() {
    // create scheduled job if not exist
    if (!CircleJobs.findOne({type: CircleJobs.TYPE_SCANNER, status: {$ne: 'completed'}})) {
      let job = new Job(CircleJobs, CircleJobs.TYPE_SCANNER, {}),
          schedule = later.parse.text('at 4:00');

      job.priority('normal')
        .retry({
          retries: 1,
          wait: 60 * 60 * 1000})  // 1 hour between attempts
        .repeat({schedule: schedule})
        .save();
      console.log('Created scheduled job');
    }
  };

  // azbuka profile update
  CircleJobs.startUpdaterWorker = function() {
    queue = CircleJobs.processJobs(CircleJobs.TYPE_SCANNER, {
      workTimeout: 30 * 60 * 1000,
    }, worker);
  };

  function worker(job, callback) {
    // Only called when there is a valid job
    console.log('processing job', job.doc._id);
    var completedAccum = 0;

    var setting = getSettings(),
        gender = setting.sex,
        scrapOptions = setting.scrap,
        isEnabled = scrapOptions.enableScanner,
        lastScanDate = scrapOptions.date || new Date(),
        now = new Date(),
        diffDays = (now - lastScanDate) / (24 * 60 * 60 * 1000),
        extraDays = scrapOptions.extraDays || 0,
        daysForScan = Math.floor(diffDays + extraDays + 1);

    if (!isEnabled) {
      job.done('Scrap is not enabled, skip');
    } else if (daysForScan < 1) {
      job.done('Looks job planned in future: ' + Math.abs(daysForScan));
    } else {
      try {
        if (gender === 'any' || gender === 'female') {
          process(daysForScan, 'female', logProgressFn);
        }
        if (gender === 'any' || gender === 'female') {
          process(daysForScan, 'male', logProgressFn);
        }
      } catch (e) {
        if (e.stack) {
          job.fail(e.stack);
        } else {
          job.fail('' + e);
        }
      } finally {
        Settings.update(setting._id, {$set: {'scrap.date': new Date()}});
        job.done();
      }
    }

    console.log('finish job', job.doc._id);

    callback();
    return;

    // help funtion for progressing job
    function logProgressFn(numOfProfiles) {
      completedAccum = completedAccum + numOfProfiles;
      job.progress(completedAccum, completedAccum + 1);
    }
  } // worker

  function process(days, sex, progressFn) {
    var page = 1;
    var result = [];
    do {
      result = Azbuka.search({days: days, page: page, sex: sex});

      result.forEach(function(item) {
        // create/update new user
        var profileId = item._id;
        var soul = {
          $setOnInsert: _.pick(item, '_id', 'name', 'visible', 'sex'),
          $addToSet: {
            images: item.imageId
          }
        };

        Souls.upsert(profileId, soul);

        // create update profile job
        FetchJobs.createProfileJob(profileId);

        // TODO: add image job for {item._id, item.imageId}
      });


      page++;
      Meteor._sleepForMs(2000);
      progressFn(3);

    } while(result.length);

  }
});
