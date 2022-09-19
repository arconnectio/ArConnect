import panelHTML from "url:./devtools/index.html";
import browser from "webextension-polyfill";
import icon from "url:./assets/icon512.png";

browser.devtools.panels.create(
  "ArConnect",
  icon.split("/").pop(),
  panelHTML.split("/").pop()
);

export default function Devtools() {
  return (
    <>
      <h1>ArConnect Developer Tools</h1>
    </>
  );
}
