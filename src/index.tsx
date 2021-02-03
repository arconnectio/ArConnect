import React from "react";
import ReactDOM from "react-dom";
import App from "./views/Popup/App";
import Provider from "./components/Provider";
import "./styles/index.sass";

ReactDOM.render(
  <Provider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>,
  document.getElementById("root")
);
