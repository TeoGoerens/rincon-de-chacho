// Import React dependencies
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";
import "./ProdeTeamsStyles.css";

//Import React Query functions
import fetchAllProdeTeams from "../../../../reactquery/prode/fetchAllProdeTeams";
import updateProdeTeam from "../../../../reactquery/prode/updateProdeTeam";

// Import components
import InfoTip from "../InfoTip";

const API_NAME_HINT =
  "El nombre que devuelve la API. No se edita: es la clave con la que los jugadores del pool quedan asociados a su equipo, y cambiarlo los desvincularía a todos.";

const ProdeTeamsIndex = () => {
  const queryClient = useQueryClient();

  /* Fila en edición (id del equipo) + su borrador. Se edita de a una: son dos
     campos cortos y un form aparte por equipo sería peor */
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ displayName: "", code: "" });
  const [activeLeague, setActiveLeague] = useState(null);

  const {
    data: teamsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-teams"],
    queryFn: fetchAllProdeTeams,
  });

  const updateMutation = useMutation({
    mutationFn: updateProdeTeam,
    onSuccess: () => {
      toast.success("Equipo actualizado");
      setEditingId(null);
      queryClient.invalidateQueries(["prode-teams"]);
    },
    onError: (mutationError) => {
      toast.error(mutationError?.message || "Error al actualizar el equipo");
    },
  });

  const teams = useMemo(() => teamsData ?? [], [teamsData]);

  const leagues = useMemo(
    () => [...new Set(teams.map((team) => team.league))].sort(),
    [teams],
  );

  /* Liga vigente: la elegida, o la primera apenas cargan los datos */
  const currentLeague =
    activeLeague && leagues.includes(activeLeague) ? activeLeague : leagues[0];

  const visibleTeams = teams.filter((team) => team.league === currentLeague);
  const missingCode = visibleTeams.filter((team) => !team.code).length;

  const startEdit = (team) => {
    setEditingId(team._id);
    setDraft({ displayName: team.displayName, code: team.code });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ displayName: "", code: "" });
  };

  const saveEdit = (teamId) => {
    updateMutation.mutate({
      teamId,
      displayName: draft.displayName,
      code: draft.code,
    });
  };

  /* Enter guarda, Escape cancela: son dos campos, abrir el mouse para cada
     confirmación haría eterna la carga de 30 equipos */
  const handleKeyDown = (event, teamId) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit(teamId);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  };

  const renderCode = (team) =>
    team.code ? (
      <span className="pte-code">{team.code}</span>
    ) : (
      <span className="pte-code pte-code--empty">Sin código</span>
    );

  const renderEditFields = (team) => (
    <>
      <input
        className="pte-input"
        value={draft.displayName}
        autoFocus
        onChange={(event) =>
          setDraft((previous) => ({
            ...previous,
            displayName: event.target.value,
          }))
        }
        onKeyDown={(event) => handleKeyDown(event, team._id)}
      />
      <input
        className="pte-input pte-input--code"
        value={draft.code}
        maxLength={3}
        placeholder="ABC"
        onChange={(event) =>
          setDraft((previous) => ({
            ...previous,
            code: event.target.value.toUpperCase(),
          }))
        }
        onKeyDown={(event) => handleKeyDown(event, team._id)}
      />
    </>
  );

  const renderEditActions = (team) => (
    <div className="pte-actions">
      <button
        type="button"
        className="pte-btn pte-btn--save"
        disabled={updateMutation.isPending}
        onClick={() => saveEdit(team._id)}
      >
        Guardar
      </button>
      <button
        type="button"
        className="pte-btn"
        onClick={cancelEdit}
      >
        Cancelar
      </button>
    </div>
  );

  return (
    <div className="pri">
      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            Prode
          </div>
          <h1 className="pri-title">Equipos</h1>
          <p className="pri-subtitle">
            {teamsData
              ? `${visibleTeams.length} equipos${
                  missingCode > 0 ? ` · ${missingCode} sin código` : ""
                }`
              : "Cargando..."}
          </p>
        </div>
      </div>

      {isError ? (
        <p className="pri-state">
          {error?.message || "Ocurrió un error al cargar los equipos."}
        </p>
      ) : isLoading ? (
        <p className="pri-state">Cargando equipos...</p>
      ) : teams.length <= 0 ? (
        <p className="pri-state">
          Todavía no hay equipos: se cargan solos cuando un universo del Gran DT
          tiene jugadores en su pool.
        </p>
      ) : (
        <>
          {/* ── Pills por liga ── */}
          <div className="pte-leagues">
            {leagues.map((league) => (
              <button
                type="button"
                key={league}
                className={`pte-league${
                  league === currentLeague ? " pte-league--active" : ""
                }`}
                onClick={() => {
                  cancelEdit();
                  setActiveLeague(league);
                }}
              >
                {league}
              </button>
            ))}
          </div>

          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>
                    <span className="pte-th">
                      Nombre API
                      <InfoTip text={API_NAME_HINT} />
                    </span>
                  </th>
                  <th>Nombre en el sitio</th>
                  <th>Código</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeams.map((team) => {
                  const isEditing = editingId === team._id;
                  return (
                    <tr key={team._id}>
                      <td>
                        <span className="pte-api-name">{team.apiName}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="pte-input"
                            value={draft.displayName}
                            autoFocus
                            onChange={(event) =>
                              setDraft((previous) => ({
                                ...previous,
                                displayName: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => handleKeyDown(event, team._id)}
                          />
                        ) : (
                          <span className="pri-cell-name">
                            {team.displayName}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="pte-input pte-input--code"
                            value={draft.code}
                            maxLength={3}
                            placeholder="ABC"
                            onChange={(event) =>
                              setDraft((previous) => ({
                                ...previous,
                                code: event.target.value.toUpperCase(),
                              }))
                            }
                            onKeyDown={(event) => handleKeyDown(event, team._id)}
                          />
                        ) : (
                          renderCode(team)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          renderEditActions(team)
                        ) : (
                          <button
                            type="button"
                            className="pte-btn"
                            onClick={() => startEdit(team)}
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="pri-mobile-list">
            {visibleTeams.map((team) => {
              const isEditing = editingId === team._id;
              return (
                <div className="pri-mobile-card" key={team._id}>
                  <div className="pri-mobile-row-top">
                    {isEditing ? (
                      <div className="pte-edit-fields">
                        {renderEditFields(team)}
                      </div>
                    ) : (
                      <span className="pri-cell-name">{team.displayName}</span>
                    )}
                    {!isEditing && renderCode(team)}
                  </div>
                  <div className="pri-mobile-row-bottom">
                    <span className="pte-api-name">{team.apiName}</span>
                    {isEditing ? (
                      renderEditActions(team)
                    ) : (
                      <button
                        type="button"
                        className="pte-btn"
                        onClick={() => startEdit(team)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ProdeTeamsIndex;
