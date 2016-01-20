/*global SimpleSchema, Meteor, Errors */

/* collect some errors */
var Schema = new SimpleSchema({
  body: {
    type: Object,
    optional: true,
    blackbox: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();  // Prevent user from supplying their own value
      }
    },
  }
});

/* jshint -W020 */
// Error colection, propery 'body' as blackbox
Errors = new Meteor.Collection('errors');
Errors.attachSchema(Schema);
