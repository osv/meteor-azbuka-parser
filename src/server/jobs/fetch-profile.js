/*global Job, FetchJobs, getSettings, Azbuka */
Meteor.startup(function() {

  // create job for updating azbuka's profile
  FetchJobs.createProfileJob = function(profileId) {
    var hasJob = FetchJobs.findOne({
      type: FetchJobs.TYPE_PROFILE_FETCH,
      'data.profileId': profileId,
      status: {$ne: 'completed'}
    });

    // create scheduled job if not exist
    if (!hasJob) {
      let job = new Job(FetchJobs,
                        FetchJobs.TYPE_PROFILE_FETCH,
                        {profileId: profileId});

      job.priority('normal')
        .retry({
          retries: 1,
          wait: 15 * 60 * 1000})  // 15 minutes between attempts
        .delay(30 * 60 * 1000)    // Wait an hour before first try
        .save();
    }
  };

  FetchJobs.startProfileWorker = function() {
    FetchJobs.processJobs(FetchJobs.TYPE_PROFILE_FETCH, {
      workTimeout: 30 * 60 * 1000,
    }, worker);
  };

  var loggedIn = false;

  function worker(job, callback) {
    console.log('processing profile job');

    console.log(job);
    try {
      fetchProfile(job);
    } catch (e) {
      job.fail('' + e);
    } finally {
      job.done();
    }
    callback();
  }

  function fetchProfile(job) {
    var jobData = job.data || {},
        profileId = jobData.profileId,
        query = {
          azbukaProfile: profileId,
          authorized: false,
        };

    check(profileId, String);

    var data = Azbuka.getProfile(query);

    // auth required for view profile images?
    if (data.invisibleImages) {
      // set flag that we need fetch profile usin auth cookie
      query.authorized = true;

      // run login in this job
      let didLogin = false;

      // first run, no cookie?
      if (!loggedIn) {
        job.log(`Try login into azbuka`);
        doLogin();
        didLogin = true;
        // now try get profile data again
      }

      job.log('Fetch profile using auth cookie');
      data = Azbuka.getProfile(query);

      // no images, looks like cooike was expired, relogin if no login did int this job
      if (data.invisibleImages && !didLogin) {
        doLogin();
        data = Azbuka.getProfile(query);
      }

      if (data.invisibleImages) {
        throw new Error('Login was performed but still no images!');
      }

      saveProfileData(profileId, data);
    }
  }

  function doLogin() {
    let setting = getSettings(),
        azbukaSettings = setting.azbuka || {},
        login = azbukaSettings.login,
        password = azbukaSettings.password;

    if (!login || !password) {
      throw new Error('Azbuka\'s login or password not configured');
    }

    Azbuka.login(login, password);
    loggedIn = true;
  }

  function saveProfileData(profileId, data) {
    console.log(`profile ${profileId}`, data);
  }
});
