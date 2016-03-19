/*global CircleJobs, ReactiveVar, moment */

// Job control
Template.control.helpers({
  circleJobs() {
    return CircleJobs.find({status: {$ne: 'completed'}}, {sort: {type: 1}});
  }

});
