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


## The Details

**git-validate** exports a few methods to be used for creating your custom hooks.

### `copy`

Copy a file or directory from your hook to a target project.

```javascript
Validate.copy(source, target, options);
```

Where `source` is a path relative to your install script, and `target` is a path relative to the root of the project that is installing the module. For example if my module has the layout:

```
bin/install
jshintrc
```

And I wish for the file `jshintrc` to be placed in the root of projects as `.jshintrc` when running `bin/install`, I would call `Validate.copy('../jshintrc', '.jshintrc')`.

Note that `source` may be a file *or* a directory. If a directory is specified than a new directory will be created at `target` and the *full contents* of source will be copied to the `target` directory recursively.

The only `option` currently available is `overwrite`. When set to `true` overwrite will *always* copy the given file, overwriting any existing destination file. If this is not set, `copy` will instead silently fail and leave the old file in place. I *highly* recommend always using `{ overwrite: true }` on your `.validate.json` file.


### `installHooks`

Install one or more git hooks to the current repo.

```javascript
Validate.installHooks('pre-commit');
Validate.installHooks(['pre-commit', 'pre-push']);
```

This method will copy the hook script to the appropriate path in your repo's `.git/hooks` path.


## Configuration

### `.validate.json`

This is the file that configures defaults for your git hooks.

The `scripts` property should be an object with named scripts, exactly the same as the `scripts` property in your `package.json`. This gives you a place to define some default scripts to be used in your hooks. Note that any script defined in your `package.json` will take precedence over one defined in `.validate.json`. This is what makes it safe to always overwrite `.validate.json` with the newest possible copy, since if your project requires changes to the scripts, you can make them in `package.json` instead.

In addition to the `scripts` property, this file will be parsed and checked for keys matching the name of your git hooks (e.g. `pre-commit`, `pre-push`, etc) and used to provide a default list of hooks to be run for each hook. The keys must be an array of script names to be run. If any of the scripts are not defined, they will be skipped and a message will be printed showing that no script was found, as such it is safe to set scripts here that you wish to always be custom in every project. The `.validate.json` file for [precommit-hook](https://github.com/nlf/precommit-hook) looks like this:


```javascript
{
  "scripts": {
    "lint": "jshint ."
  },
  "pre-commit": ["lint", "validate", "test"]
}
```

### per-branch hooks

It is also possible to run scripts only for a specific branch by specifying the key in your `package.json` as `hook-name#branch`:

```javascript
{
  "pre-commit": ["lint", "test"],
  "pre-commit#dev": ["lint"]
}
```

In the above example, when run in the `dev` branch only the `lint` script will be run, however in all other branches both `lint` and `test` will be run.
