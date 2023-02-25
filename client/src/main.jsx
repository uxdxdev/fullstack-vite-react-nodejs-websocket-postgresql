import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider, defaultTheme } from "@adobe/react-spectrum";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider theme={defaultTheme}>
    <App />
  </Provider>
);
