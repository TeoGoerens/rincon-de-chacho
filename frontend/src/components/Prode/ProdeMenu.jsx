import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

const PRODE_TABS = [
  { label: "Inicio", to: "/prode", exact: true },
  { label: "Torneo", to: "/prode/torneo" },
  { label: "Records", to: "/prode/records" },
  { label: "H2H", to: "/prode/h2h" },
];

const ProdeMenu = () => (
  <SectionNav tabs={PRODE_TABS} accentColor="var(--color-prode)" />
);

export default ProdeMenu;
