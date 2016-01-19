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
    type: Date,
  }
});

var SoulSchema = new SimpleSchema({
  _id: {
    type: String,
  },

  loc: {
    type: String,
    label: 'Location of user'
  },

  age: {
    type: Number,
  },

  sex: {
    type: String
  },

  views: {
    type: Number,
    optional: true
  },

  visible: {
    type: Boolean,
    label: 'Is user have hidden photo',
    optional: true
  },

  mainInfo: {
    type: String,
  },

  history: {
    label: 'Changed fields',
    type: [SoulHistorySchema],
    optional: true,
  },

  // Force value to be current date (on server) upon update
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
