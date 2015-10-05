/* global
    Accounts: false,
    BlazeLayout: false,
    FlowRouter: false,
    Match: false,
    UAFlowRouting: false,
    UALog: false,
    UserAccounts: false
*/
'use strict';


// ------------------------------------------
//  Logs the start of execution for this file
// ------------------------------------------
UALog.trace('Loading main.js');

// Plugin configuration pattern to be checked with check
var CONFIG_PAT = {
  defaultTemplate: new Match.Optional(String),
  defaultLayout: new Match.Optional(String),
  defaultLayoutRegions: new Match.Optional(Object),
  defaultContentRegion: new Match.Optional(String),
};

// Route configuration pattern to be checked with check
var ROUTE_PAT = {
  contentRegion: new Match.Optional(String),
  layoutRegions: new Match.Optional(String),
  layoutTemplate: new Match.Optional(String),
  name: new Match.Optional(String),
  path: new Match.Optional(String),
  redirect: new Match.Optional( new Match.OneOf(
    String,
    new Match.Where(_.isFunction)
  )),
  template: new Match.Optional(String),
};

var ROUTE_DEFAULT = {
  changePwd: { name: 'uaChangePwd', path: '/change-password'},
  enrollAccount: { name: 'uaEnrollAccount', path: '/enroll-account'},
  ensureSignedIn: { name: 'uaEnsureSignedIn', path: null},
  forgotPwd: { name: 'uaForgotPwd', path: '/forgot-password'},
  resetPwd: { name: 'uaResetPwd', path: '/reset-password'},
  signIn: { name: 'uaSignIn', path: '/sign-in'},
  signUp: { name: 'uaSignUp', path: '/sign-up'},
  verifyEmail: { name: 'uaVerifyEmail', path: '/verify-email'},
  sendVerifyEmail: { name: 'uaSendVerifyEmail', path: '/send-verify-email'},
};


_.extend(UAFlowRouting, {

  _id: 'flowrouting',

  // Current configuration values
  defaultLayoutRegions: {},
  defaultTemplate: null,
  defaultContentRegion: null,

  // Redirects
  homeRoutePath: '/',
  redirectTimeout: 2000, // 2 seconds

  // Known routes used to filter out previous path for redirects...
  knownRoutes: [],

  // Configured routes
  routes: {},

  configure: function configure(options) {
    check(options, CONFIG_PAT);
    UALog.trace('configure ' + this._id);
    // console.log(options);

    this.defaultContentRegion =
      options.defaultContentRegion || this.defaultContentRegion;

    this.defaultLayout =
      options.defaultLayout || this.defaultLayout;

    this.defaultLayoutRegions =
      _.defaults(options.defaultLayoutRegions || {}, this.defaultLayoutRegions);

    this.defaultTemplate =
      options.defaultTemplate || this.defaultTemplate;
  },

  configureRoute: function configureRoute(route, options) {
    check(route, String);
    check(options, new Match.OneOf(
      undefined,
      new Match.ObjectIncluding(ROUTE_PAT))
    );
    options = _.clone(options);

    // Only allowed routes can be configured
    if (!(route in ROUTE_DEFAULT)) {
      throw new Error('Unknown Route!');
    }
    // Allow route configuration only once
    if (route in this.routes) {
      throw new Error('Route already configured!');
    }

    // Possibly adds a initial / to the provided path
    if (options && options.path && options.path[0] !== '/') {
      options.path = '/' + options.path;
    }

    // Updates the current configuration
    options = _.defaults(options || {}, ROUTE_DEFAULT[route]);

    // Store route options
    this.routes[route] = options;

    // Known routes are used to filter out previous path for redirects...
    this.knownRoutes.push(options.name);

    if (Meteor.isServer) {
      // Configures 'reset password' email link
      if (route === 'resetPwd') {
        var resetPwdPath = options.path.substr(1);
        Accounts.urls.resetPassword = function resetPassword(token) {
          return Meteor.absoluteUrl(resetPwdPath + '/' + token);
        };
      }
      // Configures 'enroll account' email link
      if (route === 'enrollAccount') {
        var enrollAccountPath = options.path.substr(1);
        Accounts.urls.enrollAccount = function enrollAccount(token) {
          return Meteor.absoluteUrl(enrollAccountPath + '/' + token);
        };
      }
      // Configures 'verify email' email link
      if (route === 'verifyEmail') {
        var verifyEmailPath = options.path.substr(1);
        Accounts.urls.verifyEmail = function verifyEmail(token) {
          return Meteor.absoluteUrl(verifyEmailPath + '/' + token);
        };
      }
    }

    if (route === 'ensureSignedIn') {
      return;
    }

    /*
    if (route === 'changePwd' && !UserAccounts.options.enablePasswordChange) {
      throw new Error(
        'changePwd route configured but enablePasswordChange set to false!'
      );
    }
    if (route === 'forgotPwd' && !UserAccounts.options.showForgotPasswordLink) {
      throw new Error(
        'forgotPwd route configured but showForgotPasswordLink set to false!'
      );
    }
    if (route === 'signUp'
      && UserAccounts.options.forbidClientAccountCreation) {
      throw new Error(
        'signUp route configured but forbidClientAccountCreation set to true!'
      );
    }
    */

    // fullPageAtForm template unless user specified a different
    // site-wide default
    var defaultTemplate = this.defaultTemplate || 'uaFullPageForm';
    // Determines the default layout to be used in case no specific one is
    // specified for single routes
    var defaultLayout = this.defaultLayout;
    var defaultLayoutRegions = this.defaultLayoutRegions;
    var defaultContentRegion = this.defaultContentRegion;

    var name = options.name; // Default provided...
    var path = options.path; // Default provided...
    var template = options.template || defaultTemplate;
    var layoutTemplate = options.layoutTemplate || defaultLayout;
    var contentRegion = options.contentRegion || defaultContentRegion;
    var layoutRegions = _.clone(
      options.layoutRegions || defaultLayoutRegions || {}
    );
    layoutRegions[contentRegion] = template;

    // Possibly adds token parameter
    if (_.contains(['enrollAccount', 'resetPwd', 'verifyEmail'], route)) {
      path += '/:paramToken';
      if (route === 'verifyEmail') {
        FlowRouter.route(path, {
          name: name,
          triggersEnter: [
            function triggersEnter() {
              UserAccounts.setInitialState(route);
              /*
              UserAccounts.setDisabled(true);
              */
            },
          ],
          action: function action(params) {
            BlazeLayout.render(layoutTemplate, layoutRegions);

            var token = params.paramToken;
            Accounts.verifyEmail(token, function verifyEmail(error) {
              // TODO: ...
              /*
              UserAccounts.setDisabled(false);
              UserAccounts.submitCallback(error, route, function() {
                UserAccounts.state.form.set(
                  'result', UserAccounts.texts.info.emailVerified
                );
              });
              */
            });
          },
        });
      } else {
        FlowRouter.route(path, {
          name: name,
          triggersEnter: [
            function triggersEnter() {
              UserAccounts.setInitialState(route);
            },
          ],
          action: function action() {
            BlazeLayout.render(layoutTemplate, layoutRegions);
          },
        });
      }
    } else {
      FlowRouter.route(path, {
        name: name,
        triggersEnter: [
          function triggersEnter() {
            var redirect = false;
            if (route === 'changePwd') {
              if (!Meteor.loggingIn() && !Meteor.userId()) {
                redirect = true;
              }
            } else if (Meteor.userId()) {
              redirect = true;
            /*
            }
            if (redirect) {
              UserAccounts.postSubmitRedirect(route);
            */
            } else {
              UserAccounts.setInitialState(route);
            }
          },
        ],
        action: function action() {
          BlazeLayout.render(layoutTemplate, layoutRegions);
        },
      });
    }
  },


  getRouteName: function getRouteName(route) {
    if (route in this.routes) {
      return this.routes[route].name;
    }
    return null;
  },

  getRoutePath: function getRoutePath(route) {
    if (route in this.routes) {
      return this.routes[route].path;
    }
    return '#';
  },

});


UALog.trace('Adding FlowRouting plugin');
UserAccounts._plugins.flowrouting = UAFlowRouting;
UserAccounts.flowrouting = UAFlowRouting;
