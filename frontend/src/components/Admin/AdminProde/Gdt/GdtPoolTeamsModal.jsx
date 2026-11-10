// Import React dependencies
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";

//Import React Query functions
import fetchGdtPoolTeams from "../../../../reactquery/prode/fetchGdtPoolTeams";

const formatShortDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

/* Un equipo cuenta como importado si ya tiene jugadores en el pool (cubre
   universos cargados antes del import selectivo) o si su último import
   salió bien */
const isImported = (team) =>
  team.poolCount > 0 || team.lastImport?.status === "imported";

/* Modal de selección de equipos de la liga del universo. Lo comparten el
   import del pool (mode "import") y el detector de diferencias (mode
   "detect"): cada plantel consultado es una request de la cuota diaria de
   API-Football, así que el admin elige qué equipos gastan cuota. */
const GdtPoolTeamsModal = ({
  universeId,
  mode,
  initialSelection,
  onConfirm,
  onClose,
}) => {
  const isImport = mode === "import";
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["gdt-pool-teams", universeId],
    queryFn: () => fetchGdtPoolTeams(universeId),
    staleTime: 60 * 1000,
    retry: false,
  });
  const teams = useMemo(() => data?.teams ?? [], [data]);

  /* Selección inicial: la última usada en el detector; si no hay, los que
     faltan importar (import) o los ya importados (detector) */
  useEffect(() => {
    if (!data || selected !== null) return;
    const knownIds = new Set(teams.map((team) => team.providerTeamId));
    const previous = (initialSelection ?? []).filter((id) => knownIds.has(id));
    if (previous.length > 0) {
      setSelected(new Set(previous));
      return;
    }
    setSelected(
      new Set(
        teams
          .filter((team) => (isImport ? !isImported(team) : isImported(team)))
          .map((team) => team.providerTeamId),
      ),
    );
  }, [data, teams, selected, initialSelection, isImport]);

  const selection = selected ?? new Set();

  const visibleTeams = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? teams.filter((team) => team.name.toLowerCase().includes(term))
      : teams;
  }, [teams, search]);

  const toggleTeam = (providerTeamId) => {
    setSelected((current) => {
      const next = new Set(current ?? []);
      if (next.has(providerTeamId)) next.delete(providerTeamId);
      else next.add(providerTeamId);
      return next;
    });
  };

  const selectWhere = (predicate) =>
    setSelected(
      new Set(
        teams.filter(predicate).map((team) => team.providerTeamId),
      ),
    );

  /* Gasto estimado: en el detector, un plantel en el cache del server
     (media hora) sale gratis */
  const selectedTeams = teams.filter((team) =>
    selection.has(team.providerTeamId),
  );
  const cost = isImport
    ? selectedTeams.length
    : selectedTeams.filter((team) => !team.cached).length;
  const remaining = data?.quota?.remaining ?? null;
  const overQuota = remaining !== null && cost > remaining;

  const teamMeta = (team) => {
    const parts = [];
    if (team.lastImport?.status === "failed") {
      parts.push(`Falló el ${formatShortDate(team.lastImport.importedAt)}`);
    }
    if (team.poolCount > 0) {
      parts.push(plural(team.poolCount, "jugador", "jugadores") + " en el pool");
    }
    if (team.lastImport?.status === "imported") {
      parts.push(`importado el ${formatShortDate(team.lastImport.importedAt)}`);
    }
    if (parts.length === 0) parts.push("Sin importar");
    if (!isImport && team.cached) parts.push("en cache, no gasta cuota");
    return parts.join(" · ");
  };

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-modal pri-tm">
        <h4>
          {isImport
            ? "¿Qué equipos querés importar?"
            : "¿Qué equipos querés comparar?"}
        </h4>
        <p className="pri-tm-intro">
          {isImport
            ? "Cada equipo es una request de la cuota diaria de API-Football. Re-importar un equipo solo suma los jugadores que falten: no pisa tus ediciones."
            : "Se compara el pool contra los planteles actuales de estos equipos. Los que están en cache (consultados en la última media hora) no gastan cuota."}
        </p>

        {isLoading && <p className="pri-state">Consultando la liga...</p>}
        {isError && (
          <p className="pri-state">
            {error?.message || "Error al listar los equipos de la liga"}
          </p>
        )}

        {data && (
          <>
            <div className="pri-tm-tools">
              <input
                type="search"
                className="pri-search-input pri-tm-search"
                placeholder="Buscar equipo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="pri-tm-quick">
                <button
                  type="button"
                  className="pri-status-btn"
                  onClick={() => selectWhere(() => true)}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className="pri-status-btn"
                  onClick={() => setSelected(new Set())}
                >
                  Ninguno
                </button>
                <button
                  type="button"
                  className="pri-status-btn"
                  onClick={() =>
                    selectWhere((team) =>
                      isImport ? !isImported(team) : isImported(team),
                    )
                  }
                >
                  {isImport ? "Sin importar" : "Importados"}
                </button>
              </div>
            </div>

            <div className="pri-tm-list">
              {visibleTeams.length === 0 && (
                <p className="pri-state">Ningún equipo coincide.</p>
              )}
              {visibleTeams.map((team) => (
                <label className="pri-tm-row" key={team.providerTeamId}>
                  <input
                    type="checkbox"
                    checked={selection.has(team.providerTeamId)}
                    onChange={() => toggleTeam(team.providerTeamId)}
                  />
                  <span className="pri-tm-info">
                    <span className="pri-tm-name">{team.name}</span>
                    <span
                      className={`pri-tm-meta ${
                        team.lastImport?.status === "failed"
                          ? "pri-tm-meta--failed"
                          : ""
                      }`}
                    >
                      {teamMeta(team)}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {data.unresolvedTeams.length > 0 && (
              <p className="pri-tm-note">
                Sin resolver en API-Football (falta un alias en la config):{" "}
                {data.unresolvedTeams.join(", ")}
              </p>
            )}

            <p className={`pri-tm-cost ${overQuota ? "pri-tm-cost--over" : ""}`}>
              {plural(selectedTeams.length, "equipo elegido", "equipos elegidos")}{" "}
              · vas a gastar {plural(cost, "request", "requests")}
              {remaining !== null
                ? ` · te ${remaining === 1 ? "queda" : "quedan"} ${remaining} hoy`
                : " · cuota de hoy sin consultar"}
            </p>
            {overQuota && (
              <p className="pri-tm-note pri-tm-note--warn">
                No alcanza la cuota de hoy: los equipos que no entren quedan sin{" "}
                {isImport ? "importar" : "comparar"} y los podés retomar mañana.
              </p>
            )}
          </>
        )}

        <div className="delete-confirmation-btn-container">
          <button className="delete-confirmation-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="delete-confirmation-btn-confirm"
            onClick={() => onConfirm([...selection])}
            disabled={!data || selection.size === 0}
          >
            {isImport
              ? `Importar ${plural(selection.size, "equipo", "equipos")}`
              : `Comparar ${plural(selection.size, "equipo", "equipos")}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GdtPoolTeamsModal;
