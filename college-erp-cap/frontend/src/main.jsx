import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ButtonSoundProvider } from "./context/ButtonSoundContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PublicSettingsProvider } from "./context/PublicSettingsContext";
import "./styles/theme.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PublicSettingsProvider>
          <ThemeProvider>
            <ButtonSoundProvider>
              <AppRoutes />
            </ButtonSoundProvider>
          </ThemeProvider>
        </PublicSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


