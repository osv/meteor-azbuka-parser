/*global Acl, Meteor */

/* jshint -W020 */
Acl = {};

Acl.isAdmin = function(user){
  user = (typeof user === 'undefined') ? Meteor.user() : user;
  return !!user && !!user.isAdmin;
};

Acl.isAdminById = function(userId){
  var user = Meteor.users.findOne(userId);
  return !!(user && Acl.isAdmin(user));
};
