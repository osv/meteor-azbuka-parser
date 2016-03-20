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

Template.registerHelper('prettyJson', function(obj) {
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
    return '<span class="json-' + cls + '">' + match + '</span>';
  }
});
