# Contributing to ArConnect

The following is a set of guidelines for contributing to the ArConnect extension. Thank you for your interest 😊.

## Building the project

Clone this repo, then open a terminal at the root of the project.

Install the dependencies. We are using the Yarn package manager:

```sh
yarn install
```

To build from source, you will need to execute the `build` command followed by the target for which you are building. For example:

```sh
yarn build:chrome
```

If you want to run in development mode that provides hot-code reloading, run:

```sh
yarn dev:chrome
```

The compiled extension will be stored in the `build` folder. Now all you need to do is to load the built files as an "Unpacked extension" in Chrome / Brave. Open the extensions manager and click "Load unpacked" (this button will not be visible if developer mode is not toggled). Select the `dev-chrome-mv3` (if you are testing in development mode) or `build-chrome-mv3` folder when it asks for a directory to load.

## Commits and code-style

Please adhere to the prettier configuration provided and run:

```sh
yarn fmt
```

to format your code accordingly.

Commits should look similar to this:

```sh
feat: add more cool stuff
```

Please follow [this guide](https://www.conventionalcommits.org/en/v1.0.0/#summary) on best practices for commit messages.

## i18n

We currently support English and Chinese (simplified) in the project.
Please provide all text used in the UI inside `messages.json` within the correct locale folder (currently `/assets/_locales/`).

## Required languages

This project is based in Plasmo, uses Typescript and React Styled Components.
