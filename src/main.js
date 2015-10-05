/* global
    UserAccounts: false,
    UALog: false,
    UAFlowRoutingPlugin: false
*/
'use strict';


// ------------------------------------------
//  Logs the start of execution for this file
// ------------------------------------------
UALog.trace('Loading main.js');


UALog.trace('Adding flowrouting plugin');
UserAccounts.registerPlugin(new UAFlowRoutingPlugin());
