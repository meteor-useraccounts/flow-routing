/* global
    BlazeLayout: false,
    FlowRouter: false,
    UAFlowRoutingPlugin: true,
    UALog: false,
    UAPlugin: false,
    UserAccounts: false
*/
'use strict';


// ------------------------------------------
//  Logs the start of execution for this file
// ------------------------------------------
UALog.trace('Loading flowrouting_plugin.js');


// define the UAFlowRoutingPlugin class
UAFlowRoutingPlugin = function _UAFlowRoutingPlugin() {
  // Call the parent constructor
  UAPlugin.call(this);

  this._id = 'flowrouting';
};

// inherit UAPlugin
UAFlowRoutingPlugin.prototype = new UAPlugin();

_.extend(UAFlowRoutingPlugin.prototype, {
  constructor: UAFlowRoutingPlugin,

  _id: 'flowrouting',

  /**
   *  Plugin configuration pattern to be checked with check
   */
  _configPattern: {
    defaultTemplate: new Match.Optional(String),
    defaultLayout: new Match.Optional(String),
    defaultLayoutRegions: new Match.Optional(Object),
    defaultContentRegion: new Match.Optional(String),
  },

  /**
   *
   */
  _routeDefaults: {
    changePwd: { name: 'uaChangePwd', path: '/change-password'},
    enrollAccount: { name: 'uaEnrollAccount', path: '/enroll-account'},
    ensureSignedIn: { name: 'uaEnsureSignedIn', path: null},
    forgotPwd: { name: 'uaForgotPwd', path: '/forgot-password'},
    resetPwd: { name: 'uaResetPwd', path: '/reset-password'},
    signIn: { name: 'uaSignIn', path: '/sign-in'},
    signUp: { name: 'uaSignUp', path: '/sign-up'},
    verifyEmail: { name: 'uaVerifyEmail', path: '/verify-email'},
    sendVerifyEmail: { name: 'uaSendVerifyEmail', path: '/send-verify-email'},
  },

  /**
   *  Route configuration pattern to be checked with check
   */
  _routePattern: {
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
  },

  /**
   *
   */
  defaultContentRegion: null,

  /**
   *
   */
  defaultLayoutRegions: {},

  /**
   *
   */
  defaultTemplate: null,

  /**
   *
   */
  homeRoutePath: '/',

  /**
   *  Known routes used to filter out previous path for redirects
   */
  knownRoutes: [],

  /**
   *
   */
  redirectTimeout: 2000, // 2 seconds

  /**
   *  Configured routes
   */
  routes: {},

  /**
   * configure - description
   *
   * @param  {type} options description
   * @return {type}         description
   */
  configure: function configure(options) {
    var self = this;

    UALog.trace('UAFlowRoutingPlugin.configure');

    check(options, self._configPattern);

    UALog.trace('configure ' + self._id);

    self.defaultContentRegion =
      options.defaultContentRegion || self.defaultContentRegion;

    self.defaultLayout =
      options.defaultLayout || self.defaultLayout;

    self.defaultLayoutRegions =
      _.defaults(options.defaultLayoutRegions || {}, self.defaultLayoutRegions);

    self.defaultTemplate =
      options.defaultTemplate || self.defaultTemplate;
  },

  /**
   * configureRoute - description
   *
   * @param  {type} route   description
   * @param  {type} options description
   * @return {type}         description
   */
  configureRoute: function configureRoute(route, routeOptions) {
    var self = this;
    var contentRegion;
    var layoutRegions;
    var layoutTemplate;
    var name;
    var options;
    var paramToken;
    var path;
    var routePath;
    var template;

    UALog.trace('UAFlowRoutingPlugin.configureRoute');

    check(route, String);
    check(routeOptions, new Match.OneOf(
      undefined,
      new Match.ObjectIncluding(self._routePattern))
    );
    options = _.clone(routeOptions);

    // Only allowed routes can be configured
    if (!(route in self._routeDefaults)) {
      throw new Error('Unknown Route!');
    }
    // Allow route configuration only once
    if (route in self.routes) {
      throw new Error('Route already configured!');
    }

    // Possibly adds a initial / to the provided path
    if (options && options.path && options.path[0] !== '/') {
      options.path = '/' + options.path;
    }

    // Updates the current configuration
    options = _.defaults(options || {}, self._routeDefaults[route]);

    // Store route options
    self.routes[route] = options;

    // Known routes are used to filter out previous path for redirects...
    self.knownRoutes.push(options.name);

    if (Meteor.isServer) {
      // Configures 'reset password' email link
      if (route === 'resetPwd') {
        routePath = options.path.substr(1);
        Accounts.urls.resetPassword = function resetPassword(token) {
          return Meteor.absoluteUrl(routePath + '/' + token);
        };
      }
      // Configures 'enroll account' email link
      if (route === 'enrollAccount') {
        routePath = options.path.substr(1);
        Accounts.urls.enrollAccount = function enrollAccount(token) {
          return Meteor.absoluteUrl(routePath + '/' + token);
        };
      }
      // Configures 'verify email' email link
      if (route === 'verifyEmail') {
        routePath = options.path.substr(1);
        Accounts.urls.verifyEmail = function verifyEmail(token) {
          return Meteor.absoluteUrl(routePath + '/' + token);
        };
      }
    }

    if (route === 'ensureSignedIn') {
      return;
    }

    name = options.name; // Default provided...
    path = options.path; // Default provided...

    // fullPageAtForm template unless differently specified
    template = options.template || self.defaultTemplate || 'uaFullPageForm';

    // Determines the default layout to be used in case no specific one is
    // specified for single routes
    layoutTemplate = options.layoutTemplate || self.defaultLayout;

    contentRegion = options.contentRegion || self.defaultContentRegion;

    layoutRegions = _.clone(
      options.layoutRegions || self.defaultLayoutRegions || {}
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

            paramToken = params.paramToken;
            Accounts.verifyEmail(paramToken, function verifyEmail(error) {
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
            }

            if (redirect) {
              UserAccounts.postSubmitRedirect(route);
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

  /**
   * getRouteName - description
   *
   * @param  {type} route description
   * @return {type}       description
   */
  getRouteName: function getRouteName(route) {
    var self = this;

    UALog.trace('UAFlowRoutingPlugin.getRouteName');

    if (route in self.routes) {
      return self.routes[route].name;
    }
    return null;
  },

  /**
   * getRoutePath - description
   *
   * @param  {type} route description
   * @return {type}       description
   */
  getRoutePath: function getRoutePath(route) {
    var self = this;

    UALog.trace('UAFlowRoutingPlugin.getRoutePath');

    if (route in self.routes) {
      return self.routes[route].path;
    }
    return '#';
  },

});
