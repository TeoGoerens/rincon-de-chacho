import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

const PODRIDA_TABS = [
  { label: "Inicio",        to: "/podrida",                 exact: true },
  { label: "Estadísticas",  to: "/podrida/estadisticas"                 },
  { label: "Jugadores",     to: "/podrida/jugadores"                    },
];

const PodridaMenu = () => (
  <SectionNav tabs={PODRIDA_TABS} accentColor="var(--color-podrida)" />
);

export default PodridaMenu;
