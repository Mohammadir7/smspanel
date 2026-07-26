import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { TraceProvider } from "./trace/TraceContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TraceProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </TraceProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
