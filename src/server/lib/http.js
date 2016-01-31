/*global syncRequest, Meteor, makeErrorByStatus */
var request = Meteor.npmRequire('request');

var populateData = function(response) {
  var contentType, err;
  contentType = (response.headers['content-type'] || ';').split(';')[0];
  if (_.include(['application/json', 'text/javascript'], contentType)) {
    try {
      response.data = JSON.parse(response.content);
    } catch (error1) {
      err = error1;
      response.data = null;
    }
  } else {
    response.data = null;
  }
};

var normalizeOptions = function(uri, options, callback) {
  if (!uri) {
    throw new Error('undefined is not a valid uri or options object.');
  }
  if ((typeof options === 'function') && !callback) {
    callback = options;
  }
  if (options && typeof options === 'object') {
    options.uri = uri;
  } else if (typeof uri === 'string') {
    options = {
      uri: uri
    };
  } else {
    options = uri;
  }
  return {
    options: options,
    callback: callback
  };
};

var normalizeResponse = function(error, res, body) {
  var response;
  response = null;
  if (!error) {
    response = {};
    response.statusCode = res.statusCode;
    response.content = body;
    response.headers = res.headers;
    populateData(response);
    if (response.statusCode >= 400) {
      error = makeErrorByStatus(response.statusCode, response.content);
    }
  }
  return {
    error: error,
    response: response
  };
};

var wrappedRequest = function(uri, options, callback) {
  var ref;

  ref = normalizeOptions(uri, options, callback);
  options = ref.options;
  callback = ref.callback;
  return request(options, function(error, res, body) {
    var ref1, response;
    ref1 = normalizeResponse(error, res, body);
    error = ref1.error;
    response = ref1.response;
    return callback(error, response);
  });
};

var wrappedCall = function(method, uri, options, callback) {
  options.method = method;
  return wrappedRequest(uri, options, callback);
};

var wrappedGet = function(uri, options, callback) {
  return wrappedCall('GET', uri, options, callback);
};

var wrappedPost = function(uri, options, callback) {
  return wrappedCall('POST', uri, options, callback);
};

var wrappedPut = function(uri, options, callback) {
  return wrappedCall('PUT', uri, options, callback);
};

var wrappedDelete = function(uri, options, callback) {
  return wrappedCall('DELETE', uri, options, callback);
};

/* jshint -W020 */
syncRequest = Meteor.wrapAsync(wrappedRequest);
syncRequest.call = Meteor.wrapAsync(wrappedCall);
syncRequest.get = Meteor.wrapAsync(wrappedGet);
syncRequest.post = Meteor.wrapAsync(wrappedPost);
syncRequest.put = Meteor.wrapAsync(wrappedPut);
syncRequest['delete'] = Meteor.wrapAsync(wrappedDelete);
syncRequest.del = syncRequest['delete'];
// create request's jar
syncRequest.jar = request.jar;
