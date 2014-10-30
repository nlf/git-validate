#git-validate

This is a super simple framework to facilitate creating your own modules similar to [precommit-hook](https://github.com/nlf/precommit-hook).

## Usage

This module isn't intended to be used directly in your projects (thought it can be), but rather as the dependency of a module that you create that will act as a template of sorts.

To create a validate module, first make a new directory and use `npm init` to initialize your module:

```bash
mkdir validate-nlf
cd validate-nlf
npm init
```

Follow the prompts, and when complete install this module:

```bash
npm install --save git-validate
```

Now, let's say we want to provide a default `.jshintrc` file, let's go ahead and create that file in our new directory and fill it with some options:

```bash
vim jshintrc
```

```javascript
{
  "node": true,

  "curly": true,
  "latedef": true,
  "quotmark": true,
  "undef": true,
  "unused": true,
  "trailing": true
}
```

Note that we saved the file as `jshintrc` without the leading dot.

Next, let's create our install script:

```bash
vim install.js
```

```javascript
var Validate = require('git-validate');

Validate.copy('jshintrc', '.jshintrc');
```

This instructs **git-validate** to copy the `jshintrc` file in our module to `.jshintrc` in the root of the project that installs it.

Now we edit our `package.json` to tell it about our install script:

```javascript
  "scripts": {
    "install": "node install.js"
  }
```

And that's it for the simplest possible example. Now anytime you install `validate-nlf` you'll automatically get a `.jshintrc` file in your project.

This wouldn't be any fun without the git hooks though, so let's extend it a bit further to make sure that `jshint` is run any time a user tries to `git commit` after installing our module. To do so, let's create a `validate.json` file with the following contents:

```javascript
{
  "scripts": {
    "lint": "jshint ."
  },
  "pre-commit": ["lint"]
}
```

And then let's add a line to our install.js to make sure it gets installed as `.validate.json` (note the leading dot).

```javascript
Validate.copy('validate.json', '.validate.json', { overwrite: true });
```

Great, that's it! You'll notice the `{ overwrite: true }` object as the last parameter to `copy`. This tells **git-validate** that it's ok to overwrite an existing file. Without that option, the copy method would fail silently if the file already exists. That's why we didn't use it for our `.jshintrc` because that's something a user should be able to configure.

Now when a user tries to run `git commit` **git-validate** will open `.validate.json` and see that the `pre-commit` event wants to run the `lint` script. It will load your project's `package.json` to see if you have a `lint` script defined there first. If you do not, it will use the `lint` script present in the `.validate.json` file and run it. If the script fails, the commit is denied. Easy!
