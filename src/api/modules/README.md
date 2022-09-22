# ArConnect modules

ArConnect modules construct the individual functions the injected API provides to dApps. A module consists of 3 parts:

- The module declaration file: provides basic info about the module, such as name and required permissions
- The foreground script file:
  - Includes a function that allows the transformation of the submitted params to the function, before sending the transformed params to the background (runs in the injected script)
  - Has an optional "finalizer" function that allows the transformation / validation of the data returned from the background
- The background script file: has a function that handles the API call in the background (runs in the background script)

Each module has to be added separately in the two module files (`background.ts` and `foreground.ts`).

### Examples

For basic examples on how to create a module, refer to the [example module](example/).
