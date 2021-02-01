import React from "react";
import ReactDOM from "react-dom";
import App from "./views/Popup/App";
import Provider from "./components/Provider";

ReactDOM.render(
  <Provider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>,
  document.getElementById("root")
);
