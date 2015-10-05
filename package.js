// Package metadata for Meteor.js web platform (https://www.meteor.com/)
// This file is defined within the Meteor documentation at
//
//   http://docs.meteor.com/#/full/packagejs
//
// and it is needed to define a Meteor package
'use strict';


var Both = ['client', 'server'];
var Client = 'client';


Package.describe({
  name: 'useraccounts:flow-routing',
  summary: 'UserAccounts package providing routes configuration capability via kadira:flow-router.',
  version: '2.0.0',
  git: 'https://github.com/meteor-useraccounts/flow-routing.git',
});

Package.onUse(function pkgOnUse(api) {
  api.versionsFrom('1.0');

  // Logger
  api.use([
    'check',
    'jag:pince@0.0.9',
    'kadira:blaze-layout',
    'kadira:flow-router',
    'reactive-var',
    'underscore',
    'useraccounts:core',
  ], Both);

  api.imply([
    'kadira:blaze-layout@2.1.0',
    'kadira:flow-router@2.6.2',
    'useraccounts:core@2.0.0',
  ], Both);

  api.addFiles([
    'src/_globals.js',
    'src/logger.js',
    'src/main.js',
  ], Both);

  api.addFiles([
    'src/client.js',
  ], Client);
});
