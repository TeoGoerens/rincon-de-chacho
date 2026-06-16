import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

const PODRIDA_TABS = [
  { label: "Inicio",       to: "/podrida",                exact: true },
  { label: "Historial",    to: "/podrida/historial"                   },
  { label: "Estadísticas", to: "/podrida/estadisticas"                },
];

const PodridaMenu = () => (
  <SectionNav tabs={PODRIDA_TABS} accentColor="var(--color-podrida)" />
);

export default PodridaMenu;
