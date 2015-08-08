# Flow Router add-on for User Accounts

User Accounts is a suite of packages for the [Meteor.js](https://www.meteor.com/) platform. It provides highly customizable user accounts UI templates for many different front-end frameworks. At the moment it includes forms for sign in, sign up, forgot password, reset password, change password, enroll account, and link or remove of many 3rd party services.

This package is an optional add-on for integration with [Flow Router][1] and [Blaze Layout][2].

## Configuration

Before you configure routes for User Accounts with Flow Router, you will need to make sure you have set a few default configuration items.  

Assuming you have a main layout that looks like this:

```handlebars
<template name="myLayout">
  
  <div class="nav">
    {{> Template.dynamic template=nav}}
  </div>
  
  <div class="content">
    {{> Template.dynamic template=main}}
  </div>

  <footer>
    {{> Template.dynamic template=footer}}
  </footer>
  
</template>
```

You would configure this package to use it like this:

```js
AccountsTemplates.configure({
    defaultLayout: 'myLayout',
    defaultLayoutRegions: {
        nav: 'myNav',
        footer: 'myFooter'
    },
    defaultContentRegion: 'main'
});
```

If you don't have extra content regions (nav, footer, etc) you should pass an empty object to the config like this:

```js
AccountsTemplates.configure({
    defaultLayout: 'myLayout',
    defaultLayoutRegions: {},
    defaultContentRegion: 'main'
});
```

NOTE: The above configs must load BEFORE your AccountsTemplates routes are defined (next section).

## Routes

There are no routes provided by default, but you can easily configure routes for sign in, sign up, forgot password, reset password, change password, enroll account using `AccountsTemplates.configureRoute`.  

The simplest way is to make the call passing in only a route code (available route codes are: signIn, signUp, changePwd, forgotPwd, resetPwd, enrollAccount). 

This will set up the sign in route with a full-page form:

```js
AccountsTemplates.configureRoute('signIn');
```

You can also pass in more options to adapt it to your needs with:

```js
AccountsTemplates.configureRoute(route_code, options);
```

The following is a complete example of a custom route configuration:

```js
AccountsTemplates.configureRoute('signIn', {
    name: 'signin',
    path: '/login',
    template: 'myLogin',
    layoutTemplate: 'myLayout',
    layoutRegions: {
      nav: 'myNav',
      footer: 'myFooter'
    },
    contentRegion: 'main'
});
```

All options are passed to FlowRouter.route() which then creates a new custom route (see the official Flow Router documentation [here](https://atmospherejs.com/kadira/flow-router) for more details).  All the above fields are optional and fall back to default values in case you don't provide them. 

[1]: https://atmospherejs.com/kadira/flow-router
[2]: https://atmospherejs.com/kadira/blaze-layout