import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Popup from "../popup";

// import './index.css'

// TODO: Duplicate "Popup" as "Iframe" and move all routers to config to be able to combine Popup + Auth.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
