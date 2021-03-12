# ArConnect

ArConnect is a browser extension allowing Arweave wallet holders to interact with dApps securely and easily.

## API

You can interact with basic ArConnect functionalities using [`arweave-js`](https://npmjs.com/arweave). To create a transaction, you just don't pass in the user's wallet instance:

```ts
const tx = await arweave.createTransaction({
  /* config */
});
```

Than, you can use ArConnect to add the users wallet to the transaction and sign it (as before, you don't pass in the user's wallet instance, that is done by ArConnect):

```ts
await arweave.transactions.sign(tx);
```

Done! Now you can post the transaction.

## Events

ArConnect has some useful custom events.

### `arweaveWalletLoaded`

Triggers when the ArConnect global object (`window.arweaveWallet`) is injected into the page. It can be useful when executing functions on page load.

```ts
window.addEventListener("arweaveWalletLoaded", () => {
  /** Handle ArConnect load event **/
});
```

### `walletSwitch`

Triggers, when the user switches their wallet in the ArConnect extension popup.

```ts
window.addEventListener("walletSwitch", (e) => {
  const newAddress = e.detail.address;
  /** Handle wallet switch **/
});
```

Requires the `ACCESS_ADDRESS` and the `ACCESS_ALL_ADDRESSES` [permissions](#permissions).

## Other supported functions

ArConnect supports much more with it's powerful API. These features are not integrated into arweave-js right now, but please let us know if you would like to see them added or not. You can access all of these using the global `window.arweaveWallet` object (`window.arweaveWallet.getActiveAddress()`, etc.).

All of these functions are asynchronous, so you will need to `await` them.

### `connect(permissions)`

Connect to ArConnect and request permissions. See the available permissions [here](#permissions).

- `permissions`: An array of [permissions](#permissions)

### `disconnect()`

Disconnect from ArConnect. Removes all permissions from your site.

### `getActiveAddress()`

Get the currently used wallet's address in the extension.

- `returns`: A wallet address

Requires the `ACCESS_ADDRESS` [permission](#permissions).

### `getAllAddresses(): Promise<string[]>`

Get all addresses added to the ArConnect extension

- `returns`: A list of the added wallets' addresses.

Requires the `ACCESS_ALL_ADDRESSES` [permission](#permissions).

### `sign(transaction, options?)`

Sign a transaction. Raw version of what is used in the `arweave-js` [API](#api).

- `transaction`: A valid Arweave transaction without a wallet keyfile added to it
- `options`: Arweave signing options
  <br />
- `returns`: Signed transaction instance

Requires the `SIGN_TRANSACTION` [permission](#permissions).

### `encrypt(data, options): Promise<Uint8Array>`

Encrypt a string, using the user's wallet.

- `data`: String to encrypt
- `options`: Encrypt [options](#encryption-options)
  <br />
- `returns`: Encrypted string

Requires the `ENCRYPT` [permission](#permissions).

#### Encryption options

```ts
{
  algorithm: string; // encryption algorithm
  hash: string; // encryption hash
  salt?: string; // optional salt
}
```

### `decrypt(data, options): Promise<string>`

Decrypt a string [encrypted](#encryptdata-options-promiseuint8array) with the user's wallet.

- `data`: `Uint8Array` data to decrypt to a string
- `options`: Decrypt [options](#encryption-options)
  <br />
- `returns`: Decrypted string

Requires the `DECRYPT` [permission](#permissions).

### `getPermissions()`

Get the [permissions](#permissions) allowed for you site by the user.

- `returns`: A list of [permissions](#permissions) allowed for your dApp.

## Permissions

There are three permissions currently available. When calling `connect`, you need to specify at least one of them, preferably `ACCESS_ADDRESS`.

The permissions:

- `ACCESS_ADDRESS`:
  Access the current address selected in WeaveMask

- `ACCESS_ALL_ADDRESSES`:
  Access all addresses added to WeaveMask

- `CREATE_TRANSACTION`:
  Create a new transaction

- `ENCRYPT`:
  Encrypt data using the user's keyfile

- `DECRYPT`:
  Decrypt data using the user's keyfile

## License

Licensed under the [MIT](./../LICENSE) license.
