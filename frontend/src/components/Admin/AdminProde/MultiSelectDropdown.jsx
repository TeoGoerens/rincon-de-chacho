// Import React dependencies
import React, { useEffect, useRef, useState } from "react";

// Imports CSS & helpers
import "./ProdeFormStyles.css";

/* Desplegable con selección múltiple por checkboxes: reemplaza a los chips
   en campos de muchas opciones (meses y participantes del torneo). El botón
   muestra un resumen provisto por el padre; el panel lista las opciones
   tildables y se cierra con click afuera o Escape. */
const MultiSelectDropdown = ({ placeholder, summary, options, selected, onToggle }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hasSelection = selected.length > 0;

  return (
    <div className="prf-ms" ref={wrapRef}>
      <button
        type="button"
        className={`prf-ms-trigger${open ? " prf-ms-trigger--open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div
          className={`prf-ms-summary${
            hasSelection ? "" : " prf-ms-summary--placeholder"
          }`}
        >
          {hasSelection ? summary : placeholder}
        </div>
        <div className="prf-ms-chevron" aria-hidden="true">
          ▾
        </div>
      </button>

      {open && (
        <div className="prf-ms-panel">
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className="prf-ms-option"
                onClick={() => onToggle(option.value)}
              >
                <div
                  className={`prf-catalog-check${
                    isSelected ? " prf-catalog-check--on" : ""
                  }`}
                />
                <div className="prf-ms-option-label">{option.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
