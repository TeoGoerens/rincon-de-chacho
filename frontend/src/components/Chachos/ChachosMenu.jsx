import React from "react";
import SectionNav from "../Layout/SectionNav/SectionNav";

const CHACHOS_TABS = [
  { label: "Inicio",       to: "/chachos/inicio"                         },
  { label: "Estadísticas", to: "/chachos",                  exact: true  },
  { label: "Fechas",       to: "/chachos/tournament-rounds"              },
  { label: "Nosotros",     to: "/chachos/squad"                          },
];

const ChachosMenu = () => (
  <SectionNav tabs={CHACHOS_TABS} accentColor="var(--color-chachos)" />
);

export default ChachosMenu;
