// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import fetchGdtUniversesByTournament from "../../../../reactquery/prode/fetchGdtUniversesByTournament";
import fetchProdeSportsLeagues from "../../../../reactquery/prode/fetchProdeSportsLeagues";
import createGdtUniverse from "../../../../reactquery/prode/createGdtUniverse";

const CreateGdtUniverse = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tournamentId, setTournamentId] = useState("");
  const [label, setLabel] = useState("");
  const [leagueProviderId, setLeagueProviderId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: tournamentsData } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });
  /* Solo torneos no finalizados pueden recibir universos GDT */
  const tournaments = useMemo(
    () => (tournamentsData ?? []).filter((t) => t.status !== "finished"),
    [tournamentsData],
  );

  useEffect(() => {
    if (!tournamentId && tournaments.length > 0) {
      const active = tournaments.find((t) => t.status === "active");
      setTournamentId((active ?? tournaments[0])._id);
    }
  }, [tournaments, tournamentId]);

  const { data: sportsLeagues } = useQuery({
    queryKey: ["prode-sports-leagues"],
    queryFn: fetchProdeSportsLeagues,
    staleTime: 30 * 60 * 1000,
  });

  /* El primer equipo del torneo suele ser el principal: se sugiere solo */
  const { data: existingTeams } = useQuery({
    queryKey: ["gdt-universes", tournamentId],
    queryFn: () => fetchGdtUniversesByTournament(tournamentId),
    enabled: !!tournamentId,
  });
  const hasPrimary = (existingTeams ?? []).some((team) => team.isPrimary);

  useEffect(() => {
    if (existingTeams) setIsPrimary(!hasPrimary);
  }, [existingTeams, hasPrimary]);

  const mutation = useMutation({
    mutationFn: createGdtUniverse,
    onSuccess: (teamCreated) => {
      toast.success("Universo GDT creado — ahora importá su pool de jugadores");
      queryClient.invalidateQueries(["gdt-universes", tournamentId]);
      navigate(`/admin/prode/gdt/${teamCreated._id}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el universo GDT");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tournamentId) {
      toast.error("Seleccioná un torneo");
      return;
    }
    if (!label.trim()) {
      toast.error("Poné un nombre al universo GDT");
      return;
    }
    if (!leagueProviderId) {
      toast.error("Elegí la liga del universo GDT");
      return;
    }

    mutation.mutate({
      tournament: tournamentId,
      label: label.trim(),
      leagueProviderId,
      isPrimary,
    });
  };

  return (
    <>
      {mutation.isPending && <SpinnerOverlay />}

      <div className="prf-page">
        <div className="prf-header">
          <div className="prf-header-text">
            <div className="prf-eyebrow">
              <span className="prf-eyebrow-dot" />
              Prode · Gran DT
            </div>
            <h1 className="prf-title">Crear universo GDT</h1>
          </div>
          <Link className="prf-back-link" to="/admin/prode/gdt">
            Volver
          </Link>
        </div>

        <form className="prf-form" onSubmit={handleSubmit}>
          <div className="prf-field">
            <label>Torneo</label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              required
            >
              {tournaments.length === 0 && (
                <option value="">No hay torneos disponibles</option>
              )}
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.year})
                </option>
              ))}
            </select>
          </div>

          <div className="prf-field">
            <label>Nombre del universo</label>
            <input
              type="text"
              value={label}
              placeholder="Ej: GDT Primera División"
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="prf-field">
            <label>Liga</label>
            <select
              value={leagueProviderId}
              onChange={(e) => setLeagueProviderId(e.target.value)}
              required
            >
              <option value="">Elegí la liga</option>
              {(sportsLeagues ?? []).map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
            <p className="prf-hint">
              De esta liga se importa el pool de jugadores del universo.
            </p>
          </div>

          <div className="prf-field">
            <label className="prf-checkbox-label">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              Universo principal del torneo
            </label>
            <p className="prf-hint">
              El principal (liga argentina) es el que se juega casi todas las
              fechas y el único con ventanas de cambios mensuales. Los
              suplentes quedan fijos tras su draft. Solo puede haber un
              principal por torneo{hasPrimary ? " — este torneo ya lo tiene" : ""}.
            </p>
          </div>

          <button
            type="submit"
            className="prf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Crear universo GDT"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateGdtUniverse;
