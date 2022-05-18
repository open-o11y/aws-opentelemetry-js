# aws-opentelemetry-js
AWS extensions to the OpenTelemetry JavaScript API and SDK. ADOT metrics are in preview for JavaScript/

You may find OpenTelemetry [Here](https://github.com/open-telemetry)

# Contributing Guide

We'd love your help!

## How to contribute

#### Conventional commit

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of. This convention dovetails with SemVer, by describing the features, fixes, and breaking changes made in commit messages. You can see examples [here](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#examples).
We use [commitlint](https://github.com/conventional-changelog/commitlint) and [husky](https://github.com/typicode/husky) to prevent bad commit message.
For example, you want to submit the following commit message `git commit -s -am "my bad commit"`.
You will receive the following error :

```text
✖   type must be one of [ci, feat, fix, docs, style, refactor, perf, test, revert, chore] [type-enum]
```

Here an exemple that will pass the verification: `git commit -s -am "chore(opentelemetry-core): update deps"`

### Fork

In the interest of keeping this repository clean and manageable, you should work from a fork. To create a fork, click the 'Fork' button at the top of the repository, then clone the fork locally using `git clone git@github.com:USERNAME/aws-opentelemetry-js.git`.

You should also add this repository as an "upstream" repo to your local copy, in order to keep it up to date. You can add this as a remote like so:

```sh
git remote add upstream https://github.com/open-o11y/opentelemetry-js.git

#verify that the upstream exists
git remote -v
```

To update your fork, fetch the upstream repo's branches and commits, then merge your master with upstream's master:

```sh
git fetch upstream
git checkout master
git merge upstream/master
```

Remember to always work in a branch of your local copy, as you might otherwise have to contend with conflicts in master.

### Running the tests (For packages)

The `opentelemetry-js` project is written in TypeScript.

- `npm install` to install dependencies.
- `npm run compile` compiles the code, checking for type errors.
- `npm run bootstrap` Bootstrap the packages in the current Lerna repo. Installs all of their dependencies and links any cross-dependencies.
- `npm test` tests code the same way that our CI will test it.
- `npm run lint` lint any changes.



Note that the `opentelemetry-resource-detector-demo` package is only for demo purpose.
