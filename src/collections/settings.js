/*global SimpleSchema, Settings, Acl, Mongo, getSettings */

/* jshint -W020 */
Settings = new Mongo.Collection('settings');

var CredentialSchema = new SimpleSchema({
  login: {
    type: String,
    autoform: {
      label: 'Azbuka login',
    }
  },

  password: {
    type: String,
    autoform: {
      label: 'Password',
    }
  },
});

var scrapSchema = new SimpleSchema({
  enableScanner: {
    type: Boolean,
    defaultValue: false,
    label: 'Enable scrapping for users'
  },
  enableProfile: {
    type: Boolean,
    defaultValue: false,
    label: 'Enable profile fetcher'
  },
  enableImage: {
    type: Boolean,
    defaultValue: false,
    label: 'Enable image (avatar) fetcher'
  },
  daysUpdateWait: {
    type: Number,
    defaultValue: 3,
    label: 'Num of days delay between update same profile'
  },
  date: {
    type: Date,
    optional: true,
    label: 'Time of last scrap. Used for get next scrap date depth computing.'
  },
  extraDays: {
    optional: true,
    type: Number,
    defaultValue: 364,
    max: 1000,
    min: 0,
    label: 'Extra days will be add to last scan "date", will be reset to 0 after next scrap done.'
  },
});

var SettingsSchema = new SimpleSchema({
  scrap: {
    type: scrapSchema,
    optional: true,
    label: 'Scrap settings',
  },

  sex: {
    type: String,
    defaultValue: 'any',
    autoform: {
      type: 'selectize',
      label: 'Which gender to scrap',
      options: [
        {label: 'Female', value: 'female'},
        {label: 'Male', value: 'male'},
        {label: 'Any', value: 'any'}
      ]
    }
  },

  days: {
    type: Number,
    defaultValue: 200,
    label: 'Days. Fetch depth. How many days user was inactive'
  },

  forceUpdate: {
    type: Boolean,
    optional: true,
    label: 'Turn on to scrap all data again.'
  },

  azbuka: {
    optional: true,
    type: CredentialSchema,
    label: 'Credential information for azbuka.ru'
  },

  userAgent: {
    type: [String],
    defaultValue: [
      'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36',
      'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2224.3 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2309.372 Safari/537.36'
    ],
    autoform: {
      label: 'User agents of crawler'
    }
  }
});

Settings.attachSchema(SettingsSchema);

Settings.allow({
  update: Acl.isAdminById,
});

Settings.PUBLIC_FIELDS = [];

getSettings = function() {
  return Settings.findOne() || {};
};
