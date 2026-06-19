import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatAgent from "./pages/ChatAgent";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import EventPlanner from "./pages/EventPlanner";
import LearningPage from "./pages/LearningPage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn(
    "VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work.",
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId ?? ""}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/agent" element={<ChatAgent />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/planner" element={<EventPlanner />} />
                <Route path="/learning" element={<LearningPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/agent" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
