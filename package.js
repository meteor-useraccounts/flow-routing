// Package metadata for Meteor.js web platform (https://www.meteor.com/)
// This file is defined within the Meteor documentation at
//
//   http://docs.meteor.com/#/full/packagejs
//
// and it is needed to define a Meteor package
'use strict';

Package.describe({
  name: 'useraccounts:flow-routing',
  summary: 'UserAccounts package providing routes configuration capability via kadira:flow-router.',
  version: '1.12.0',
  git: 'https://github.com/meteor-useraccounts/flow-routing.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0.3');

  api.use([
    'check',
    'kadira:blaze-layout',
    'kadira:flow-router',
    'underscore',
    'useraccounts:core'
  ], ['client', 'server']);

  api.imply([
    'kadira:blaze-layout@2.0.0',
    'kadira:flow-router@2.1.1',
    'useraccounts:core@1.12.0'
  ], ['client', 'server']);

  api.addFiles([
    'lib/core.js',
  ], ['client', 'server']);

  api.addFiles([
    'lib/client/client.js',
    'lib/client/templates_helpers/at_input.js'
  ], ['client']);
});
