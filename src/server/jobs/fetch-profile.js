/*global Job, FetchJobs, getSettings, Azbuka, check, Souls, Settings  */
Meteor.startup(function() {

  // create job for updating azbuka's profile
  FetchJobs.createProfileJob = function(profileId) {
    check(profileId, String);

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
          wait: 3 * 60 * 60 * 1000})  // 3h between attempts
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

    var res;
    try {
      res = fetchProfile(job);
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

  function fetchProfile(job) {
    var jobData = job.data || {},
        profileId = jobData.profileId,
        query = {
          azbukaProfile: profileId,
          authorized: false,
        };

    check(profileId, String);

    var soul = Souls.findOne(profileId);
    if (!soul) {
      return `profile "${profileId}" not found in Souls collection, skip.`;
    }

    // ensure time between update was passed
    var setting = Settings.findOne({}, {fields: {'scrap.daysUpdateWait': 1}}) || {},
        scrapSetting = setting.scrap || {},
        daysUpdateWait = scrapSetting.daysUpdateWait || 0,
        now = new Date(),
        lastUpdated = +soul.updatedAt || 0,
        diffUpdateDays = Math.floor((now - lastUpdated) / (24 * 60 * 60 * 1000));

    if (diffUpdateDays < daysUpdateWait) {
      let msg = `Request update profile "${profileId}" too soon, ` +
            `passed only ${diffUpdateDays} days (need ${daysUpdateWait})`;
      return msg;
    }

    var data = Azbuka.getProfile(query);

    // auth required for view profile images and no need request friend to see photo?
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

      if (data.invisibleImages && !data.invisiblImage4Request) {
        throw new Error('Login was performed but still no images!');
      }
    }
    saveProfileData(profileId, data);

    if (! _.isEmpty(data.images)) {
      let soul = Souls.findOne(profileId, {fields: {'images': 1}}) || {},
          images = soul.images;
      _.each(data.images, function addImageJob(imageId) {
        // TODO: create job for fetch image
        FetchJobs.createImageFetchJob(imageId);
      })
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

  function saveProfileData(soulId, data) {
    const FIELDS_NO_HISTORY = ['views', 'lastSeen', 'mainInfo',
                               'invisiblImage4Request', 'invisibleImages'];
    const FIELDS_HISTORY = ['name', 'age', 'loc'];

    var soul = Souls.findOne(soulId),
        firtTime = ! soul.about, // when  first  time profile  updated,  usually
                                 // when no 'about'
        soulAbout = soul.about || {},
        now = new Date(),
        modifiers = {
          $set: {updatedAt: now}
        },
        defaultHistoryModVal = { // add to $push if need
          history: {
            $each: [],
            $slice: -2000,
          }
        };

    FIELDS_NO_HISTORY.forEach(function diff(fieldName) {
      var fSaved = soul[fieldName],
          fNew = data[fieldName];
      if (fNew != fSaved) {
        modifiers.$set[fieldName] = fNew;
      }
    });

    // diff and add to history old value if need
    FIELDS_HISTORY.forEach(function diffAndMkHistory(fieldName) {
      var fSaved = soul[fieldName],
          fNew = data[fieldName];
      if (fNew != fSaved && fNew) {
        modifiers.$set[fieldName] = fNew;
        addHistory(fSaved, fieldName, firtTime);
      }
    });

    // diff and add to history old value if need
    // saved field 'about' of soul is: { key, val, when}
    // check if modified and use $set to set all array.
    {
      let aboutByKey = _.indexBy(soul.about, 'key'),
          modifiedAbout = false;

      _.each(data.about, function diffAboutAndMkHistory(newVal, key) {
        if ((''+(aboutByKey[key] || {}).val) !== (''+newVal) && newVal) {
          modifiedAbout = true;
          var oldVal = aboutByKey[key];
          aboutByKey[key] = {
            key: key,
            val: newVal,
            when: now
          };
          addHistory(newVal, key, firtTime);
        }

        if (modifiedAbout) {
          modifiers.$set.about = _.values(aboutByKey);
        }
      });
    }

    // extend images if need
    {
      let currentImages = soul.images || [],
          newImages = _.uniq((data.images || []).concat(currentImages)),
          haveNewImages = !!_.difference(newImages, currentImages).length;

      if (haveNewImages) {
        modifiers.$set.images = newImages;
      }
    }

    // console.log('update $set:', modifiers.$set);
    // console.log('update $push:', modifiers.$push);
    Souls.update(soul._id, modifiers);


    function addHistory(oldValue, fieldName, firtTime) {
      if (oldValue) {
        modifiers.$push = modifiers.$push || defaultHistoryModVal;
        modifiers.$push.history.$each.push({
          key: fieldName,
          val: oldValue,
          when: now,
          first: firtTime
        });
      }
    }
  }
});
