/* global
  UAFlowRouting: false,
  UALog: false,
  UserAccounts: false,
  FlowRouter: false
*/
'use strict';

_.extend(UAFlowRouting, {

  // Previous path used for redirect after form submit
  _prevPath: null,

  // Possibly keeps reference to the handle for the timed out redirect
  // set on some routes
  timedOutRedirect: null,

  /*
  clearState = function() {
    _.each(this._fields, function(field) {
      field.clearStatus();
    });
    var form = this.state.form;
    form.set('error', null);
    form.set('result', null);
    form.set('message', null);

    UserAccounts.setDisabled(false);

    // Possibly clears timed out redirects
    if (UserAccounts.timedOutRedirect !== null) {
      Meteor.clearTimeout(UserAccounts.timedOutRedirect);
      UserAccounts.timedOutRedirect = null;
    }
  },
  */

  getparamToken: function() {
    return FlowRouter.getParam('paramToken');
  },

  // Getter for previous route's path
  getPrevPath: function() {
    return this._prevPath;
  },

  // Setter for previous route's path
  setPrevPath: function(newPath) {
    check(newPath, String);
    this._prevPath = newPath;
  },

  ensureSignedIn: function(context, redirect) {
    if (!Meteor.userId()) {
      // if we're not already on an AT route
      if (!_.contains(UserAccounts.knownRoutes, context.route.name)) {

        UserAccounts.setState(UserAccounts.options.defaultState, function() {
          var err = UserAccounts.texts.errors.mustBeLoggedIn;
          UserAccounts.state.form.set("error", [err]);
        });

        // redirect settings
        UserAccounts.avoidDefaultRedirect = true;
        UserAccounts.avoidClearError = true;
        UserAccounts.redirectToPrevPath = true;

        // redirect to defined sign-in route and then redirect back
        // to original route after successful sign in
        var signInRouteName = UserAccounts.getRouteName('signIn');
        if (signInRouteName) {
          redirect(signInRouteName);
        }
        else {
          throw Error('[ensureSignedIn] no signIn route configured!');
        }
      }
    }
  },
});

UserAccounts.__startupHooks.push(function() {
  UALog.debug('Initializing flow-routing');
  // Possibly add a link callback in case the links plugin exists
  if (UserAccounts.links) {
    UserAccounts.links.onClick(function(uaTmpl, route) {
      if (uaTmpl.isDisabled()) {
        return;
      }
      var path = UserAccounts.flowrouting.getRoutePath(route);
      if (path !== '#' && path !== FlowRouter.current().path) {
        return function() {
          Meteor.defer(function() {
            FlowRouter.go(path);
            uaTmpl.setState(route);
          });
        };
      }
    });
  }
});

/*
UserAccounts.linkClick = function(route) {
  if (UserAccounts.disabled()) {
    return;
  }
  var path = UserAccounts.getRoutePath(route);
  if (path === '#' || path === FlowRouter.current().path) {
    UserAccounts.setState(route);
  } else {
    Meteor.defer(function() {
      FlowRouter.go(path);
    });
  }

  if (UserAccounts.options.focusFirstInput) {
    var firstVisibleInput = _.find(this.getFields(), function(f) {
      return _.contains(f.visible, route);
    });
    if (firstVisibleInput) {
      $('input#at-field-' + firstVisibleInput._id).focus();
    }
  }
};

UserAccounts.logout = function() {
  var onLogoutHook = UserAccounts.options.onLogoutHook;
  var homeRoutePath = UserAccounts.options.homeRoutePath;
  Meteor.logout(function() {
    if (onLogoutHook) {
      onLogoutHook();
    } else if (homeRoutePath) {
      FlowRouter.redirect(homeRoutePath);
    }
  });
};

UserAccounts.postSubmitRedirect = function(route) {
  if (UserAccounts.avoidDefaultRedirect) {
    UserAccounts.avoidDefaultRedirect = false;
    if (UserAccounts.redirectToPrevPath) {
      FlowRouter.redirect(UserAccounts.getPrevPath());
    }
  } else {
    var nextPath = UAFlowRouting.routes[route] &&
      UAFlowRouting.routes[route].redirect;
    if (nextPath) {
      if (_.isFunction(nextPath)) {
        nextPath();
      } else {
        FlowRouter.go(nextPath);
      }
    } else {
      var previousPath = UAFlowRouting.getPrevPath();
      if (previousPath && FlowRouter.current().path !== previousPath) {
        FlowRouter.go(previousPath);
      } else {
        var homeRoutePath = UAFlowRouting.homeRoutePath;
        if (homeRoutePath) {
          FlowRouter.go(homeRoutePath);
        }
      }
    }
  }
};

UserAccounts.submitCallback = function(error, state, onSuccess) {

  var onSubmitHook = UserAccounts.options.onSubmitHook;
  if (onSubmitHook) {
    onSubmitHook(error, state);
  }

  if (error) {
    if (_.isObject(error.details)) {
      // If error.details is an object, we may try to set fields errors from it
      _.each(error.details, function(error, fieldId) {
        UserAccounts.getField(fieldId).setError(error);
      });
    } else {
      var err = 'error.accounts.Unknown error';
      if (error.reason) {
        err = error.reason;
      }
      if (err.substring(0, 15) !== 'error.accounts.') {
        err = 'error.accounts.' + err;
      }
      UserAccounts.state.form.set('error', [err]);
    }
    UserAccounts.setDisabled(false);
    // Possibly resets reCaptcha form
    if (state === 'signUp' && UserAccounts.options.showReCaptcha) {
      grecaptcha.reset();
    }
  } else {
    if (onSuccess) {
      onSuccess();
    }

    if (_.contains(['enrollAccount', 'forgotPwd', 'resetPwd', 'verifyEmail'], state)) {
      var redirectTimeout = UserAccounts.options.redirectTimeout;
      if (redirectTimeout > 0) {
        UserAccounts.timedOutRedirect = Meteor.setTimeout(function() {
          UserAccounts.timedOutRedirect = null;
          UserAccounts.setDisabled(false);
          UserAccounts.postSubmitRedirect(state);
        }, redirectTimeout);
      }
    } else if (state) {
      UserAccounts.setDisabled(false);
      UserAccounts.postSubmitRedirect(state);
    }
  }
};
*/


// Stores previous path on path change...
FlowRouter.triggers.exit([
  function(context) {
    var routeName = context.route.name;
    var knownRoute = _.contains(UAFlowRouting.knownRoutes, routeName);
    if (!knownRoute) {
      UAFlowRouting.setPrevPath(context.path);
    }
  }
]);


// FlowRouter Initialization
if (FlowRouter && FlowRouter.initialize) {
  // In order for ensureSignIn triggers to work,
  // UserAccounts must be initialized before FlowRouter
  // (this is now true since useraccounts:core is being executed first...)
  var oldInitialize = FlowRouter.initialize;
  FlowRouter.initialize = function() {
    // TODO: check Initialization time sequence!
    // UserAccounts._init();
    oldInitialize.apply(this, arguments);
  };
}
