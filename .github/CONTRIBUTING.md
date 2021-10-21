# Contributing to ArConnect

The following is a set of guidelines for contributing to the ArConnect extension. Thank you for your interest 😊.

## Building the project

Clone this repo, than open a terminal at the root of the project.

Install the dependencies, we are using the Yarn package manager, please use it unless it is not possible.

```sh
yarn install
```

To actually build from source, you will need to execute the `build` command, that triggers a new `esbuild` build:

```sh
yarn build
```

If you want to build for **Firefox**, you will need to run:

```sh
yarn build:firefox
```

The compiled and bundled JS and CSS files will be built into the `public/build` folder. Now all you need to do is to load the built files as an "Unpacked extension" in Chrome / Brave. Open the extensions manager and click "Load unpacked" (this button will not be visible if developer mode is not toggled). Select the `public` folder when it asks for a directory to load.

To build for **Firefox**, you will need to zip the built files first:

```sh
yarn zip
```

Than you can click "Debug Add-ons" in the extensions menu and load the ZIP file.

## Commits and code-style

The codebase gets formatted on each commit by default. If you have git hooks disabled, make sure to run the prettier script before commiting:

```sh
yarn fmt
```

Commits should look similar to this:

```sh
feat: add more cool stuff
```

## Required languages

Please use SASS modules and TypeScript if possible.
