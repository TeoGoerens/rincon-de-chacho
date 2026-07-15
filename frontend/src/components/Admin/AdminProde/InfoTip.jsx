// Import React dependencies
import React from "react";

// Imports CSS & helpers
import "./ProdeFormStyles.css";

/* Ícono "i" con tooltip nativo (title): los textos explicativos del admin
   viven acá, no como párrafos (patrón del panel GDT, pedido del dueño).
   Los hints de ESTADO dinámico sí siguen como texto visible. */
const InfoTip = ({ text }) => (
  <span className="prf-info" title={text} aria-label={text}>
    i
  </span>
);

export default InfoTip;
