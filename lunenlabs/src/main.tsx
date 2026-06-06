import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Landing from "./pages/Landing";
import PetTracker from "./pages/PetTracker";
import Tripwire from "./pages/Tripwire";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pet" element={<PetTracker />} />
        <Route path="/tripwire" element={<Tripwire />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
