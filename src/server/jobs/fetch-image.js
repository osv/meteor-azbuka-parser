/*global Job, FetchJobs, UserImages, syncRequest, check */

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
      if (e.stack) {
        job.fail(e.stack);
      } else {
        job.fail('' + e);
      }
    } finally {
      job.done(res);
    }
    callback();
  }

  function fetchImage(job) {
    const imageBaseUrls = {
      'http://azbyka.ru/znakomstva/img/users_fotos/': UserImages.SIZE_BIG,
      'http://azbyka.ru/znakomstva/img/users_fotos_small/': UserImages.SIZE_SMALL,
      'http://azbyka.ru/znakomstva/img/users_fotos_medium/': UserImages.SIZE_MEDIUM,
    };

    var filename = job.data.imageId;

    var savedImages = UserImages.find({filename: filename}).fetch();
    _.each(imageBaseUrls, function downloadSizedImage(size, baseUrl) {
      var isSaved = _.find(savedImages, function findSameSizeInSaved(it) {
        return size === (it.metadata || {}).size;
      });
      if (!isSaved) {
        let url = baseUrl + filename;
        let image = syncRequest.get(url, {
          encoding: null,        // binary
        });
        var stream = UserImages.upsertStream({
          contentType: image.headers['content-type'] || 'image/jpeg',
          filename: filename,
          metadata: {
            size: size
          }
        });
        stream.write(image.content);
        stream.end();
        job.log('Saved ' + size);
      }
    });
  }
});
