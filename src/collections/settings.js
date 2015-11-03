/* global SimpleSchema, Settings:true, isAdminById, isAdmin */

Settings = new Mongo.Collection('Settings');

let azbukaGroup = 'Azbuka credential';

var SettingsSchema = new SimpleSchema({
  sex: {
    type: String,
    autoform: {
      type: 'select2',
      group: 'Crawl',
      label: 'Which gender to scrap',
      options: [
        {label: 'Female', value: 'female'},
        {label: 'Male', value: 'male'},
        {label: 'Any', value: 'any'}
      ]
    }
  },
  azLogin: {
    type: String,
    autoform: {
      label: 'Azbuka login',
      group: azbukaGroup
    }
  },
  azPassword: {
    type: String,
    autoform: {
      label: 'Password',
      group: azbukaGroup
    }
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
  insert: isAdminById,
  update: isAdminById,
  remove: isAdminById
});

if (Meteor.isServer) {
  Meteor.publish('setting', function() {
    if (! isAdmin(this.userId)) {
      return [];
    }

    return Settings.findOne();
  });
}
