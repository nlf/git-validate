git-validate
=============

# Projects vs. Repos

*project*: Something that has a `package.json` file in its top level directory. 

*repository* or *repo*: Something that has a `.git` directory in its top level directory. 

Repos can contain projects as well as other repos.

Projects can contain repos as well as other projects.

And a repo and project can be the same thing.

# How this thing might be used

`npm install --save-dev git-validate` 
Install git-validate and save it as a dev dependency in the project. The install script will also create `.git/hooks/pre-commit` file for you (and clobber an existing `pre-commit` hook). As yet, this pre-commit hook won't actually do anything. This step isn't really necessary though
because this will all happen as a dependency when you do the next step.

`npm install --save-dev git-validate-jshint`
This will install git-validate-jshint as a dev dependency. The install script might
do all sorts of fun stuff, like generate a .jshintrc file if one does not already
exist. Most importantly, though, it will install another file that the pre-commit
hook will run prior to a commit. Judging from the name, this hook will run `jshint`
on your code. If linting with `jshint` returns any errors, the pre-commit hook will
disallow the commit and hopefully return a useful message to the end user.

In the above example, `git-validate-jshint` will use methods in the `git-validate`
module to perform basic tasks.

`addFile(filePath, options)` will add a file (specified by `filePath`) that should be executed by the hook. 
`options` may contain an `overwrite` property (default: `false`) that, if `true`, will cause the code to overwrite an existing hook file of the same name rather than create a new hook file.
