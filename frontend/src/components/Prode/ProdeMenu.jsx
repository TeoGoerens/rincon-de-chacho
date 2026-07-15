import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

/* Records y H2H se suman acá cuando se construyan (Etapa 3.9 y 3.11) */
const PRODE_TABS = [
  { label: "Inicio", to: "/prode", exact: true },
  { label: "Torneo", to: "/prode/torneo" },
];

const ProdeMenu = () => (
  <SectionNav tabs={PRODE_TABS} accentColor="var(--color-prode)" />
);

export default ProdeMenu;
