# yarn-plugin-env-vars

This Yarn plugin makes sure that a specific set of environment variables have defined values before running any npm scripts.

## Installation

Add this plugin by running

```
yarn plugin import https://github.com/scinos/yarn-plugin-env-vars/releases/latest/download/yarn-plugin-env-vars.js
```

## Usage

To use this plugin, add a new entry called `env` to your `package.json` file and list the keys you want to set. When you run any npm script, all the environment variables listed under `env` will be set to the specified value.

If an environment variable with the same key already exists, its value won't be changed. If you add a key with the value `null`, it will unset the environment variable with that name.

In a monorepo setup, this plugin will read the `env` entry from the workspace `package.json` and merge the values with the entry from the root `package.json`.

## Example

With this config:

```js
//In package.json
"script" : {
    "test": "echo $FOO"
},
"env": {
    "FOO": "--bar"
}
```

We can run:

```sh
$ yarn test
--bar
```

### Resolution order

Here is the order in which the final environment variable is set:

1. Value from the script line
2. Value from the system
3. Value from `env` in the workspace `package.json`
4. Value from `env` in the root project's `package.json`

Example:

```js
// In root/package.json
"workspaces": {
    "packages": [
        "package1"
    ]
},
"env": {
    "FOO": "foo-root",
    "BAR": "bar-root"
}
```

```js
// In root/package1/package.json
"script" : {
    "test1": "FOO='foo-inline' env | grep FOO",
    "test2": "env | grep FOO",
    "test3": "env | grep BAR",
},
"env" : {
    "FOO": "foo-ws"
}
```

```bash
$ cd package2

$ yarn test1
FOO=foo-inline

$ yarn test2
FOO=foo-ws

$ yarn test3
BAR=bar-root

$ FOO=system yarn test2
FOO=system
```

## Rationale

This plugin provides a simpler and less error-prone alternative to manually adding environment variables to every npm script. For instance, if you have many similar scripts across multiple workspaces in a monorepo setup, adding the same set of environment variables to each script can quickly become tedious and error-prone.

For example, this set of scripts:

```js
"scripts": {
    "build": "NODE_ENV=development NODE_OPTIONS=--max-old-space-size=4096 webpack",
    "check": "prettier && NODE_OPTIONS=--max-old-space-size=4096 eslint",
}
```

Can be simplified to:

```
"scripts": {
    "build": "webpack",
    "check": "prettier && eslint",
},
"env": {
    "NODE_ENV": "development",
    "NODE_OPTIONS": "--max-old-space-size=4096"
}
```

By contrast, this plugin makes your scripts more readable and eliminates duplication. It also preserves existing options, which means that you can still customize environment variables for each command. For example, if you already have `NODE_OPTIONS="--max-old-space-size=8192"` set on your system because it has enough RAM, the former approach would overwrite it, while the latter (using the plugin) would preserve your value.

Thanks to the resolution order, you can still customize environment variables for each command. For example:

```js
"scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 webpack",
    "check": "prettier && eslint",
},
"env": {
    "NODE_ENV": "development",
    "NODE_OPTIONS": "--max-old-space-size=2048"
}
```

This configuration will run webpack with 4GB of memory, but use 2GB for prettier and eslint.

### Use cases

Here are some real-world use cases that inspired the creation of this plugin:

1. Setting the memory size for Node:

   ```js
   "env": {
       "NODE_OPTIONS": "--max-old-space-size=4096"
   }
   ```

2. Setting the default development environment (note: some test runners set `NODE_ENV=test`, which will be overwritten):

   ```js
   "env": {
        "NODE_ENV": "development"
   }
   ```

3. Defining predefined `DEBUG` options:

   ```js
   "env": {
       "DEBUG": "my-project:*"
   }
   ```

### Caveats

While this plugin simplifies the process of setting environment variables for all npm scripts, it's important to keep in mind that it sets the variables for every script, even if a particular variable is not needed. This shouldn't be a problem in most cases, but if you're using this plugin to set a variable that a script already uses (such as `NODE_ENV`), it could potentially overwrite the script's default value and cause issues that are difficult to debug.

It's also worth noting that conflicting environment variable values set at different levels (e.g., in the workspace `package.json` versus the root project `package.json`) may cause unexpected behavior. In these cases, the plugin will use the order of resolution that was explained earlier to determine which value to use.

## Contributions

Inside `test` there is a testing project that uses the plugin. It has been set up as a monorepo with two packages. Feel free to use it to test your changes.

## License

MIT