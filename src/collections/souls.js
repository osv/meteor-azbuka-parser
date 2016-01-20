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

  visible: {
    type: Boolean,
    label: 'Is user have hidden photo',
    optional: true
  },

  mainInfo: {
    type: String,
    optional: true,
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

  update: {
    type: Boolean,
    optional: true,
    defaultValue: true,
    label: 'Update this profile next time'
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
      console.log(this);

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
