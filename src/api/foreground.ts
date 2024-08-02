import type { Module, ModuleFunction } from "./module";

// import modules
import permissionsModule from "./modules/permissions";
import permissions from "./modules/permissions/permissions.foreground";
import activeAddressModule from "./modules/active_address";
import activeAddress from "./modules/active_address/active_address.foreground";
import allAddressesModule from "./modules/all_addresses";
import allAddresses from "./modules/all_addresses/all_addresses.foreground";
import publicKeyModule from "./modules/public_key";
import publicKey from "./modules/public_key/public_key.foreground";
import walletNamesModule from "./modules/wallet_names";
import walletNames from "./modules/wallet_names/wallet_names.foreground";
import arweaveConfigModule from "./modules/arweave_config";
import arweaveConfig from "./modules/arweave_config/arweave_config.foreground";
import disconnectModule from "./modules/disconnect";
import disconnect, {
  finalizer as disconnectFinalizer
} from "./modules/disconnect/disconnect.foreground";
import addTokenModule from "./modules/add_token";
import addToken from "./modules/add_token/add_token.foreground";
import isTokenAddedModule from "./modules/is_token_added";
import isTokenAdded from "./modules/is_token_added/is_token_added.foreground";
import connectModule from "./modules/connect";
import connect from "./modules/connect/connect.foreground";
import signModule from "./modules/sign";
import sign, {
  finalizer as signFinalizer
} from "./modules/sign/sign.foreground";
import dispatchModule from "./modules/dispatch";
import dispatch, {
  finalizer as dispatchFinalizer
} from "./modules/dispatch/dispatch.foreground";
import encryptModule from "./modules/encrypt";
import encrypt, {
  finalizer as encryptFinalizer
} from "./modules/encrypt/encrypt.foreground";
import decryptModule from "./modules/decrypt";
import decrypt, {
  finalizer as decryptFinalizer
} from "./modules/decrypt/decrypt.foreground";
import signatureModule from "./modules/signature";
import signature, {
  finalizer as signatureFinalizer
} from "./modules/signature/signature.foreground";
import signMessageModule from "./modules/sign_message";
import signMessage, {
  finalizer as signMessageFinalizer
} from "./modules/sign_message/sign_message.foreground";
import subscriptionModule from "./modules/subscription";
import getSubscription from "./modules/get_subscription/get_subscription.foreground";
import subscription from "./modules/subscription/subscription.foreground";
import privateHashModule from "./modules/private_hash";
import privateHash, {
  finalizer as privateHashFinalizer
} from "./modules/private_hash/private_hash.foreground";
import verifyMessageModule from "./modules/verify_message";
import verifyMessage from "./modules/verify_message/verify_message.foreground";
import signDataItemModule from "./modules/sign_data_item";
import signDataItem, {
  finalizer as signDataItemFinalizer
} from "./modules/sign_data_item/sign_data_item.foreground";
import getSubscriptionModule from "./modules/get_subscription";
import deleteSubcription from "./modules/delete_subscription/delete_subscription.foreground";
import deleteSubscriptionModule from "./modules/delete_subscription";

/** Foreground modules */
const modules: ForegroundModule[] = [
  { ...permissionsModule, function: permissions },
  { ...activeAddressModule, function: activeAddress },
  { ...allAddressesModule, function: allAddresses },
  { ...publicKeyModule, function: publicKey },
  { ...walletNamesModule, function: walletNames },
  { ...arweaveConfigModule, function: arweaveConfig },
  { ...disconnectModule, function: disconnect, finalizer: disconnectFinalizer },
  { ...connectModule, function: connect },
  { ...signModule, function: sign, finalizer: signFinalizer },
  { ...dispatchModule, function: dispatch, finalizer: dispatchFinalizer },
  { ...encryptModule, function: encrypt, finalizer: encryptFinalizer },
  { ...decryptModule, function: decrypt, finalizer: decryptFinalizer },
  { ...signatureModule, function: signature, finalizer: signatureFinalizer },
  { ...addTokenModule, function: addToken },
  { ...isTokenAddedModule, function: isTokenAdded },
  {
    ...signMessageModule,
    function: signMessage,
    finalizer: signMessageFinalizer
  },
  {
    ...privateHashModule,
    function: privateHash,
    finalizer: privateHashFinalizer
  },
  { ...verifyMessageModule, function: verifyMessage },
  {
    ...signDataItemModule,
    function: signDataItem,
    finalizer: signDataItemFinalizer
  },

  { ...getSubscriptionModule, function: getSubscription },
  { ...deleteSubscriptionModule, function: deleteSubcription },
  { ...subscriptionModule, function: subscription }
];

export default modules;

/** Extended module interface */
interface ForegroundModule extends Module<any> {
  /**
   * A function that runs after results were
   * returned from the background script.
   * This is optional and will be ignored if not set.
   */
  finalizer?: ModuleFunction<any> | TransformFinalizer<any, any, any>;
}

/**
 * @param result The result from the background script
 * @param params The params the background script received
 * @param originalParams The params the injected function was called with
 */
export type TransformFinalizer<
  ResultType,
  ParamsType = any,
  OriginalParamsType = any
> = (
  result: ResultType,
  params: ParamsType,
  originalParams: OriginalParamsType
) => any;
