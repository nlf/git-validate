commit-thingy
=============

We don't even have a proper name for this thing yet, but until we do, I'm just going
to stash notes and docs here unless it makes Nathan feel like he wants to fly down
to San Francisco specifically so he can kick me in the privates.

# Projects vs. Repos

*project*: Something that has a `package.json` file in its top level directory. 

*repository* or *repo*: Something that has a `.git` directory in its top level directory. 

Repos can contain projects as well as other repos.

Projects can contain repos as well as other projects.

And a repo and project can be the same thing.

# How this thing might be used

`npm install --save-dev commit-thingy` 
Install commit-thingy and save it as a dev dependency in the project. The install script will also create `.git/hooks/pre-commit` file for you (and clobber an existing `pre-commit` hook). As yet, this pre-commit hook won't actually do anything. This step isn't really necessary though
because this will all happen as a dependency when you do the next step.

`npm install --save-dev commit-thingy-jshint`
This will install commit-thingy-jshint as a dev dependency. The install script might
do all sorts of fun stuff, like generate a .jshintrc file if one does not already
exist. Most importantly, though, it will install another file that the pre-commit
hook will run prior to a commit. Judging from the name, this hook will run `jshint`
on your code. If linting with `jshint` returns any errors, the pre-commit hook will
disallow the commit and hopefully return a useful message to the end user.

In the above example, `commit-thingy-jshint` will use methods in the `commit-thingy`
module to perform basic tasks.

`registerHook(filename)` will take the file specified by `filename` and install it
(in a subdirectory, perhaps?) in `.git/hooks` where the pre-commit hook installed by `commit-thingy`
will find it and run it before a commit.

`addFile(filename, path)` will...(Hey, Nathan, can you fill this in?)

`deleteFile(filename, path)` will...not exist? Or what? (Hi, Nathan!)

# A note on the name

We need a better name. Someone please help. Your mission is to come up with a
better name than `emotionally-unavailable` (as in, unable to commit). 