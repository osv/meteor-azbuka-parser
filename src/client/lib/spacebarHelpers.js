/*global Template, Acl */

Template.registerHelper('constant', function (what) {
  return Meteor.App[what.toUpperCase()];
});

Template.registerHelper('isAdmin', function () {
  return Acl.isAdmin();
});

Template.registerHelper('eq', function (a, b) {
  /* jshint -W116 */
  return a == b;
});

Template.registerHelper('not', function (a) {
  return !a;
});

Template.registerHelper('prettyJson', function(obj, truncate) {
  var json = JSON.stringify(obj, true, 2);

  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, prettify);

  function prettify (match) {
    var cls;
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? 'key' : 'string';
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    } else {
      cls = 'number';
    }

    if (_.isBoolean(truncate) && truncate) {
      var ellipsis = (match.length > 64) ? '...' : '';
      match = match.substring(0, 64) + ellipsis;
    }

    return '<span class="json-' + cls + '">' + match + '</span>';
  }
});

Template.registerHelper('attrIfNot', textIfNot);
Template.registerHelper('classIfNot', textIfNot);
Template.registerHelper('classIf', textIf);

function textIfNot(prop, attr){
  if (_.isArray(prop)) {
    return _.isEmpty(prop) ? attr : '';
  } else {
    return ! prop ? attr : '';
  }
}

function textIf(prop, attr, attrNot) {
  attrNot = attrNot || '';
  attr = attr || '';
  if (_.isArray(prop)) {
    return _.isEmpty(prop) ? attrNot: attr;
  } else {
    return ! prop ? attrNot : attr;
  }
}
