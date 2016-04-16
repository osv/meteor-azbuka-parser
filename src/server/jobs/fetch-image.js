/*global Job, FetchJobs, check */

/*
 * user's picture fetcher
 */
Meteor.startup(function() {
  FetchJobs.createImageFetchJob = function(imageId) {
    check(imageId, String);

    var hasJob = FetchJobs.findOne({
      type: FetchJobs.TYPE_IMAGE_FETCH,
      'data.imageId': imageId,
      status: {$ne: 'completed'}
    });

    if (!hasJob) {
      let job = new Job(FetchJobs,
                        FetchJobs.TYPE_IMAGE_FETCH,
                        {imageId: imageId});

      job.priority('normal')
        .retry({
          retries: 1,
          wait: 26 * 60 * 60 * 1000})  // 26h between attempts
        .delay(30 * 60 * 1000)    // Wait an hour before first try
        .save();
    }
  };

  FetchJobs.startImageFetcherWorker = function() {
    FetchJobs.processJobs(FetchJobs.TYPE_IMAGE_FETCH, {
      workTimeout: 30 * 60 * 1000,
    }, worker);
  };

  function worker(job, callback) {
    console.log('fetching image');

    var res;
    try {
      res = fetchImage(job);
    } catch (e) {
      job.fail('' + e);
    } finally {
      job.done(res);
    }
    callback();
  }

  function fetchImage(job) {

  }
});
