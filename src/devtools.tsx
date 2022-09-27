import browser from "webextension-polyfill";

browser.devtools.panels.create(
  "ArConnect",
  browser.runtime.getManifest().icons["128"],
  "tabs/devtools.html"
);

const Placeholder = () => <></>;
export default Placeholder;
