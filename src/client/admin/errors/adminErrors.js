Template.adminError.onCreated(function() {
  this.expand = new ReactiveVar();
});

Template.adminError.helpers({
  expand: function() {
    return Template.instance().expand.get();
  }
});

Template.adminError.events({
  'dblclick': function(e, t) {
    var v = t.expand;
    v.set(!v.get());
  }
});
