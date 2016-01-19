/*global JobProfiles, Mongo, SimpleSchema */

/* jshint -W020 */

/*
 * This schema is used for storing id that should be scrapped soon
 */
JobProfiles = new Mongo.Collection('jobprofiles');

var JobsSchema = new SimpleSchema({
  azUserId: {
    type: String,
    label: 'User nick id for fetch from azbuka'
  },

  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();
      }
    }
  },

  state: {
    type: String,
    defaultValue: 'waiting',
  }

});

JobProfiles.attachSchema(JobsSchema);
