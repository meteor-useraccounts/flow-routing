/* global
  Logger: false,
  UALog: true
*/
'use strict';


// ------------------------------------
//  Create the logger for this package
// ------------------------------------
UALog = new Logger('useraccounts:flow-routing');

UALog.trace('Initializing logger options');


// ----------------------------------
//  Pick up settings for this logger
// ----------------------------------

var uaLogLevelSettings;
if (
  Meteor.settings &&
  Meteor.settings.public &&
  Meteor.settings.public.useraccounts
) {
  uaLogLevelSettings = Meteor.settings.public.useraccounts.logLevel;
} else if (Meteor.settings && Meteor.settings && Meteor.settings.useraccounts) {
  uaLogLevelSettings = Meteor.settings.useraccounts.logLevel;
}

if (uaLogLevelSettings && uaLogLevelSettings.flowRouting) {
  Logger.setLevel('useraccounts:flow-routing', uaLogLevelSettings.flowRouting);
}

if (Meteor.isServer && process.env.USERACCOUNTS_FR_LOGLEVEL) {
  Logger.setLevel('useraccounts:flow-routing', process.env.USERACCOUNTS_FR_LOGLEVEL);
}
