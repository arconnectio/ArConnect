import panelHTML from "url:./devtools/index.html";
import browser from "webextension-polyfill";

browser.devtools.panels.create("ArConnect", "", panelHTML.split("/").pop());

export default function Devtools() {
  return (
    <>
      <h1>ArConnect Developer Tools</h1>
    </>
  );
}
