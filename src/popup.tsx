import { useState } from "react";
import browser from "webextension-polyfill";
import dashboard from "url:./dashboard/index.html";

function Popup() {
  const [data, setData] = useState("");

  function createDashboard() {
    browser.tabs.create({
      url: dashboard
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}
    >
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      {data}
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <button onClick={createDashboard}>Test</button>
    </div>
  );
}

export default Popup;
