// Import React dependencies
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

//Import React Query functions
import linkGdtPoolTeam from "../../../../reactquery/prode/linkGdtPoolTeam";
import searchGdtPoolTeams from "../../../../reactquery/prode/searchGdtPoolTeams";

const TIER_LABEL = { 1: "1ª división", 2: "2ª división", 3: "3ª división" };

/* Un equipo de TheSportsDB que la resolución automática no pudo decidir:
   el admin elige a qué club de API-Football corresponde (sugerencias sin
   costo) o lo busca a mano (1 request). El vínculo se guarda por liga. */
const UnresolvedTeam = ({ universeId, detail }) => {
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState(null);
  const [term, setTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: searchGdtPoolTeams,
    onSuccess: ({ results }) => {
      setSearchResults(results);
      /* La búsqueda gastó cuota: el contador del modal se refresca */
      queryClient.invalidateQueries({ queryKey: ["gdt-pool-teams", universeId] });
    },
  });

  const linkMutation = useMutation({
    mutationFn: linkGdtPoolTeam,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["gdt-pool-teams", universeId] }),
  });

  /* Sugerencias + resultados de la búsqueda, sin repetir clubes */
  const suggestionIds = new Set(
    detail.suggestions.map((option) => option.providerTeamId),
  );
  const options = [
    ...detail.suggestions.map((option) => ({
      ...option,
      meta: TIER_LABEL[option.tier] ?? "",
    })),
    ...(searchResults ?? [])
      .filter((option) => !suggestionIds.has(option.providerTeamId))
      .map((option) => ({
        ...option,
        meta: option.assignedTo
          ? `ya asignado a ${option.assignedTo}`
          : "resultado de búsqueda",
      })),
  ];

  const runSearch = (event) => {
    event.preventDefault();
    if (term.trim().length < 3 || searchMutation.isPending) return;
    searchMutation.mutate({ universeId, term: term.trim() });
  };

  const confirmLink = () => {
    if (!choice || linkMutation.isPending) return;
    linkMutation.mutate({
      universeId,
      sourceTeamId: detail.sourceTeamId,
      providerTeamId: choice.providerTeamId,
      providerTeamName: choice.name,
    });
  };

  const radioName = `gdt-link-${detail.sourceTeamId}`;

  return (
    <div className="pri-ut-card">
      <p className="pri-ut-title">
        <span className="pri-ut-source">{detail.name}</span>
        <span className="pri-ut-hint">¿a qué club de API-Football corresponde?</span>
      </p>

      {options.length > 0 ? (
        <div className="pri-ut-options">
          {options.map((option) => (
            <label
              key={option.providerTeamId}
              className={`pri-ut-option ${
                option.assignedTo ? "pri-ut-option--disabled" : ""
              }`}
            >
              <input
                type="radio"
                name={radioName}
                disabled={Boolean(option.assignedTo)}
                checked={choice?.providerTeamId === option.providerTeamId}
                onChange={() => {
                  setChoice(option);
                  linkMutation.reset();
                }}
              />
              <span className="pri-tm-info">
                <span className="pri-tm-name">{option.name}</span>
                <span className="pri-tm-meta">{option.meta}</span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="pri-tm-note">
          No hay sugerencias parecidas: buscalo por nombre.
        </p>
      )}

      {searchResults && searchResults.length === 0 && (
        <p className="pri-tm-note">
          La búsqueda no encontró clubes de ese país. Probá con el nombre corto
          (por ejemplo "Leeds" en vez de "Leeds United").
        </p>
      )}

      <form className="pri-ut-search" onSubmit={runSearch}>
        <input
          type="search"
          className="pri-search-input pri-ut-search-input"
          placeholder="Buscar otro club (nombre corto)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button
          type="submit"
          className="pri-status-btn"
          disabled={term.trim().length < 3 || searchMutation.isPending}
        >
          {searchMutation.isPending ? "Buscando..." : "Buscar · 1 request"}
        </button>
      </form>

      {(searchMutation.isError || linkMutation.isError) && (
        <p className="pri-tm-note pri-tm-note--warn">
          {(linkMutation.error ?? searchMutation.error)?.message}
        </p>
      )}

      <div className="pri-ut-actions">
        <button
          type="button"
          className="pri-status-btn pri-ut-link-btn"
          disabled={!choice || linkMutation.isPending}
          onClick={confirmLink}
        >
          {linkMutation.isPending ? "Vinculando..." : "Vincular"}
        </button>
      </div>
    </div>
  );
};

const GdtUnresolvedTeams = ({ universeId, details }) => {
  const [open, setOpen] = useState(true);
  if (details.length === 0) return null;

  const count = details.length;
  return (
    <section className="pri-ut">
      <button
        type="button"
        className="pri-ut-header"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {/* <div> y no <span>: la regla global "button span" fuerza 24px */}
        <div className="pri-ut-header-text">
          {count === 1
            ? "Falta vincular 1 equipo de la liga"
            : `Faltan vincular ${count} equipos de la liga`}
        </div>
        <div className="material-symbols-outlined pri-ut-chevron">
          {open ? "expand_less" : "expand_more"}
        </div>
      </button>
      {open && (
        <>
          <p className="pri-tm-note">
            No se pudieron identificar solos en API-Football. Elegí el club
            correcto una vez y queda guardado para todos los universos de esta
            liga.
          </p>
          {details.map((detail) => (
            <UnresolvedTeam
              key={detail.sourceTeamId}
              universeId={universeId}
              detail={detail}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default GdtUnresolvedTeams;
