import React from "react";
import { Route, Routes } from "react-router-dom";

import PodridaHomePanel from "./PodridaHome/PodridaHomePanel";
import PodridaMenu from "./PodridaMenu";

const PodridaPlaceholder = ({ title }) => (
  <>
    <PodridaMenu />
    <div style={{
      minHeight: "calc(100vh - 80px - 42px)",
      background: "var(--bg-deep)",
      padding: "var(--space-xl)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{
        fontFamily: "var(--secondary-font)",
        fontSize: "var(--text-sm)",
        color: "var(--text-muted-dark)",
      }}>
        {title} — próximamente
      </p>
    </div>
  </>
);

const PodridaRoutes = () => (
  <Routes>
    <Route path="/" element={<PodridaHomePanel />} />
    <Route path="/historial" element={<PodridaPlaceholder title="Historial" />} />
    <Route path="/estadisticas" element={<PodridaPlaceholder title="Estadísticas" />} />
  </Routes>
);

export default PodridaRoutes;
