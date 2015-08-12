/* global
  AccountsTemplates: false,
  BlazeLayout: false,
  grecaptcha: false,
  FlowRouter: false,
  $: false
*/
'use strict';


// Previous path used for redirect after form submit
AccountsTemplates._prevPath = null;

// Possibly keeps reference to the handle for the timed out redirect
// set on some routes
AccountsTemplates.timedOutRedirect = null;


AccountsTemplates.clearState = function() {
  _.each(this._fields, function(field) {
    field.clearStatus();
  });
  var form = this.state.form;
  form.set('error', null);
  form.set('result', null);
  form.set('message', null);

  AccountsTemplates.setDisabled(false);

  // Possibly clears timed out redirects
  if (AccountsTemplates.timedOutRedirect !== null) {
    Meteor.clearTimeout(AccountsTemplates.timedOutRedirect);
    AccountsTemplates.timedOutRedirect = null;
  }
};

AccountsTemplates.getparamToken = function() {
  return FlowRouter.getParam('paramToken');
};

// Getter for previous route's path
AccountsTemplates.getPrevPath = function() {
  return this._prevPath;
};

// Setter for previous route's path
AccountsTemplates.setPrevPath = function(newPath) {
  check(newPath, String);
  this._prevPath = newPath;
};

AccountsTemplates.ensureSignedIn = function(context, redirect) {
  if (!Meteor.userId()) {
    // if we're not already on an AT route
    if (!_.contains(AccountsTemplates.knownRoutes, context.route.name)) {

      AccountsTemplates.setState(AccountsTemplates.options.defaultState, function() {
        var err = AccountsTemplates.texts.errors.mustBeLoggedIn;
        AccountsTemplates.state.form.set("error", [err]);
      });

      // redirect settings
      AccountsTemplates.avoidDefaultRedirect = true;
      AccountsTemplates.redirectToPrevPath = true;

      // redirect to defined sign-in route and then redirect back
      // to original route after successful sign in
      redirect('signIn');
    }
  }
};

// Stores previous path on path change...
FlowRouter.triggers.enter([
  function(context) {
    var isKnownRoute = _.map(AccountsTemplates.knownRoutes, function(route) {
      if (!route) {
        return false;
      }
      var known = RegExp(route).test(context.route.name);
      return known;
    });
    if (!_.some(isKnownRoute)) {
      AccountsTemplates.setPrevPath(context.path);
    }
  }
]);

AccountsTemplates.linkClick = function(route) {
  if (AccountsTemplates.disabled()) {
    return;
  }
  var path = AccountsTemplates.getRoutePath(route);
  if (path === '#' || path === FlowRouter.current().path) {
    AccountsTemplates.setState(route);
  } else {
    Meteor.defer(function() {
      FlowRouter.go(path);
    });
  }

  var firstVisibleInput = _.find(this.getFields(), function(f) {
    return _.contains(f.visible, route);
  });
  if (firstVisibleInput) {
    $('input#at-field-' + firstVisibleInput._id).focus();
  }
};

AccountsTemplates.logout = function() {
  var onLogoutHook = AccountsTemplates.options.onLogoutHook;
  var homeRoutePath = AccountsTemplates.options.homeRoutePath;
  Meteor.logout(function() {
    if (onLogoutHook) {
      onLogoutHook();
    } else if (homeRoutePath) {
      FlowRouter.redirect(homeRoutePath);
    }
  });
};

AccountsTemplates.postSubmitRedirect = function(route) {
  if (AccountsTemplates.avoidDefaultRedirect) {
    AccountsTemplates.avoidDefaultRedirect = false;
    if (AccountsTemplates.redirectToPrevPath) {
      FlowRouter.redirect(AccountsTemplates.getPrevPath());
    }
  } else {
    var nextPath = AccountsTemplates.routes[route] && AccountsTemplates.routes[route].redirect;
    if (nextPath) {
      if (_.isFunction(nextPath)) {
        nextPath();
      } else {
        FlowRouter.go(nextPath);
      }
    } else {
      var previousPath = AccountsTemplates.getPrevPath();
      if (previousPath && FlowRouter.current().path !== previousPath) {
        FlowRouter.go(previousPath);
      } else {
        var homeRoutePath = AccountsTemplates.options.homeRoutePath;
        if (homeRoutePath) {
          FlowRouter.go(homeRoutePath);
        }
      }
    }
  }
};

AccountsTemplates.submitCallback = function(error, state, onSuccess) {

  var onSubmitHook = AccountsTemplates.options.onSubmitHook;
  if (onSubmitHook) {
    onSubmitHook(error, state);
  }

  if (error) {
    if (_.isObject(error.details)) {
      // If error.details is an object, we may try to set fields errors from it
      _.each(error.details, function(error, fieldId) {
        AccountsTemplates.getField(fieldId).setError(error);
      });
    } else {
      var err = 'error.accounts.Unknown error';
      if (error.reason) {
        err = error.reason;
      }
      if (err.substring(0, 15) !== 'error.accounts.') {
        err = 'error.accounts.' + err;
      }
      AccountsTemplates.state.form.set('error', [err]);
    }
    AccountsTemplates.setDisabled(false);
    // Possibly resets reCaptcha form
    if (state === 'signUp' && AccountsTemplates.options.showReCaptcha) {
      grecaptcha.reset();
    }
  } else {
    if (onSuccess) {
      onSuccess();
    }

    if (_.contains(['enrollAccount', 'forgotPwd', 'resetPwd', 'verifyEmail'], state)) {
      var redirectTimeout = AccountsTemplates.options.redirectTimeout;
      if (redirectTimeout > 0) {
        AccountsTemplates.timedOutRedirect = Meteor.setTimeout(function() {
          AccountsTemplates.timedOutRedirect = null;
          AccountsTemplates.setDisabled(false);
          AccountsTemplates.postSubmitRedirect(state);
        }, redirectTimeout);
      }
    } else if (state) {
      AccountsTemplates.setDisabled(false);
      AccountsTemplates.postSubmitRedirect(state);
    }
  }
};

// Initialization
if (FlowRouter && FlowRouter.initialize) {
  // In order for ensureSignIn triggers to work,
  // AccountsTemplates must be initialized before FlowRouter
  // (this is now true since useraccounts:core is being executed first...)
  var oldInitialize = FlowRouter.initialize;
  FlowRouter.initialize = function() {
    AccountsTemplates._init();
    oldInitialize.apply(this, arguments);
  };
}
