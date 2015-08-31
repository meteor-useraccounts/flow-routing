/* global
  Logger: false,
  UALog: true,
  UserAccounts: false
*/
'use strict';


// ------------------------------------
//  Create the logger for this package
// ------------------------------------
UALog = new Logger('useraccounts:flowrouting');
UserAccounts.setLogLevel('flowrouting', UALog);
