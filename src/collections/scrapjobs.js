/*global JobProfiles, JobImages, Mongo, SimpleSchema */

/* jshint -W020 */

/*
 * This schema is used for storing id that should be scrapped soon
 */
JobProfiles = new Mongo.Collection('jobprofiles');

/*
 * Collection of images that should e fetched
 */
JobImages = new Mongo.Collection('jobimages');

var ProfileSchema = new SimpleSchema({
  _id: {
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
  },

  expireState: {
    type: Date,
    optional: true,
    label: 'Expire time when "fetching" state, after expiration reset state to "waiting"',
  },
});

var ImagesSchema = new SimpleSchema({
  _id: {
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
  },

  expireState: {
    type: Date,
    optional: true,
    label: 'Expire time when "fetching" state, after expiration reset state to "waiting"',
  },
});

JobProfiles.attachSchema(ProfileSchema);
JobImages.attachSchema(ImagesSchema);

JobProfiles.STATE_WAIT = JobImages.STATE_WAIT = 'waiting';
