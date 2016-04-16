/*
 * Collection container for fetched azbuka users
 */

/*global Souls, Mongo, SimpleSchema */

/* jshint -W020 */
Souls = new Mongo.Collection('souls');

var SoulHistorySchema = new SimpleSchema({
  key: {
    type: String,
  },
  val: {
    type: String
  },
  when: {
    type: Date
  },
  first: {          // For history only: true if inserted when history is emprty
    type: Boolean,
    optional: true,
  }
});

var SoulSchema = new SimpleSchema({
  _id: {
    type: String,
  },

  name: {
    type: String,
  },

  loc: {
    type: String,
    label: 'Location of user',
    optional: true,
  },

  age: {
    type: Number,
    optional: true,
  },

  sex: {
    type: String,
    optional: true,
  },

  views: {
    type: Number,
    optional: true
  },

  invisibleImages: {
    type: Boolean,
    label: 'Is user have hidden photo',
    optional: true
  },

  invisiblImage4Request: {
    type: Boolean,
    label: 'Is user show only for chosenone his photos',
    optional: true
  },

  mainInfo: {
    type: String,
    optional: true,
  },

  about: {
    type: [SoulHistorySchema],
    optional: true
  },

  history: {
    label: 'Changed fields',
    type: [SoulHistorySchema],
    optional: true,
  },

  images: {
    type: [String],
    optional: true
  },

  lastSeen: {
    type: Date,
    optional: true
  },

  updatedAt: {
    type: Date,
    optional: true,
    label: 'When profile successfully was updated'
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
    },
  }
});

Souls.attachSchema(SoulSchema);
