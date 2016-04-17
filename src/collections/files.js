/*global FileCollection, UserImages */

/* jshint -W020 */
UserImages = new FileCollection('userImages', {
  http: [ {
    method: 'get',
    path: '/:size/:filename',        // this will be at route "/gridfs/userImages/:md5"
    lookup: function (params, query) {  // uses express style url params
      console.log('GET', params, {
        filename: params.filename,
        'metadata.size': params.size});

      return {
        filename: params.filename,
        'metadata.size': params.size};
    }}]});

UserImages.SIZE_BIG = 'origin';
UserImages.SIZE_MEDIUM = 'medium';
UserImages.SIZE_SMALL = 'small';

if (Meteor.isServer) {
  UserImages.allow({
    read: function (userId, file) {
      return true;
    }});
}
