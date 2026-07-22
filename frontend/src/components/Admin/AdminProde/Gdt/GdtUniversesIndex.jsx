// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";
import { GDT_DRAFT_STATUS } from "../prodeAdminConstants";

//Import React Query functions
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import fetchGdtUniversesByTournament from "../../../../reactquery/prode/fetchGdtUniversesByTournament";
import deleteGdtUniverse from "../../../../reactquery/prode/deleteGdtUniverse";
import superDeleteProdeEntity from "../../../../reactquery/prode/superDeleteProdeEntity";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import SuperDeleteButton from "../../../Layout/Buttons/SuperDeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const UNIVERSE_SUPER_DELETE_WARNING =
  "Borra el universo con sus planteles y su pool aunque haya fechas jugándose con él: esas fechas quedan sin universo asignado y pierden los puntajes GDT cargados (lo ya consolidado en los duelos no se toca).";

const GdtUniversesIndex = () => {
  const queryClient = useQueryClient();
  const [tournamentId, setTournamentId] = useState("");

  const { data: tournamentsData } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });
  const tournaments = useMemo(() => tournamentsData ?? [], [tournamentsData]);

  /* Torneo por defecto: el activo más reciente; si no hay, el primero */
  useEffect(() => {
    if (!tournamentId && tournaments.length > 0) {
      const active = tournaments.find((t) => t.status === "active");
      setTournamentId((active ?? tournaments[0])._id);
    }
  }, [tournaments, tournamentId]);

  const {
    data: teamsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["gdt-universes", tournamentId],
    queryFn: () => fetchGdtUniversesByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const superDeleteMutation = useMutation({
    mutationFn: (universeId) =>
      superDeleteProdeEntity({ kind: "gdtUniverse", id: universeId }),
    onSuccess: () => {
      toast.success("Super eliminación completada");
      queryClient.invalidateQueries(["gdt-universes", tournamentId]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error en la super eliminación");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGdtUniverse,
    onSuccess: () => {
      toast.success("Universo GDT eliminado (pool incluido)");
      queryClient.invalidateQueries(["gdt-universes", tournamentId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al eliminar el universo GDT");
    },
  });

  const teams = teamsData ?? [];

  const renderTypeBadge = (team) => (
    <span
      className={`pri-badge ${
        team.isPrimary ? "pri-badge--active" : "pri-badge--inactive"
      }`}
    >
      {team.isPrimary ? "Principal" : "Suplente"}
    </span>
  );

  const renderDraftBadge = (team) => {
    const status = GDT_DRAFT_STATUS[team.draftStatus] ?? GDT_DRAFT_STATUS.open;
    return <span className={`pri-badge ${status.badge}`}>{status.label}</span>;
  };

  return (
    <div className="pri">
      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            Prode · Gran DT
          </div>
          <h1 className="pri-title">Universos GDT</h1>
          <p className="pri-subtitle">
            {teamsData
              ? `${teams.length} de 3 equipos creados en el torneo`
              : "Cargando..."}
          </p>
        </div>
        <Link className="pri-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nuevo universo GDT
        </Link>
      </div>

      <div className="pri-filter">
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} {t.year}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="pri-state">
          {error?.message || "Ocurrió un error al cargar los universos GDT."}
        </p>
      ) : isLoading || !tournamentId ? (
        <p className="pri-state">Cargando universos GDT...</p>
      ) : teams.length <= 0 ? (
        <p className="pri-state">
          El torneo todavía no tiene universos GDT. Creá el principal (liga
          argentina) para arrancar.
        </p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Liga</th>
                  <th>Tipo</th>
                  <th>Pool</th>
                  <th>Draft</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team._id}>
                    <td>
                      <Link className="pri-cell-link" to={team._id}>
                        <span className="pri-cell-name">{team.label}</span>
                      </Link>
                    </td>
                    <td>{team.league}</td>
                    <td>{renderTypeBadge(team)}</td>
                    <td>
                      {team.poolCount > 0
                        ? `${team.poolCount} jugadores`
                        : "Sin importar"}
                    </td>
                    <td>{renderDraftBadge(team)}</td>
                    <td>
                      <div className="pri-actions">
                        <EditButton to={team._id} />
                        <DeleteButton
                          onClick={deleteMutation.mutate}
                          id={{ universeId: team._id }}
                        />
                        <SuperDeleteButton
                          onClick={superDeleteMutation.mutate}
                          id={team._id}
                          warning={UNIVERSE_SUPER_DELETE_WARNING}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="pri-mobile-list">
            {teams.map((team) => (
              <div className="pri-mobile-card" key={team._id}>
                <div className="pri-mobile-row-top">
                  <Link className="pri-cell-link" to={team._id}>
                    <span className="pri-cell-name">{team.label}</span>
                  </Link>
                  <div className="pri-actions">
                    <EditButton to={team._id} />
                    <DeleteButton
                      onClick={deleteMutation.mutate}
                      id={{ universeId: team._id }}
                    />
                    <SuperDeleteButton
                      onClick={superDeleteMutation.mutate}
                      id={team._id}
                      warning={UNIVERSE_SUPER_DELETE_WARNING}
                    />
                  </div>
                </div>
                <div className="pri-mobile-row-bottom">
                  {renderTypeBadge(team)}
                  <span className="pri-mobile-meta">
                    {team.league} ·{" "}
                    {team.poolCount > 0
                      ? `${team.poolCount} jugadores`
                      : "sin importar"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GdtUniversesIndex;
