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
import fetchProdeMatchdaysByTournament from "../../../../reactquery/prode/fetchProdeMatchdaysByTournament";
import createProdeMatchday from "../../../../reactquery/prode/createProdeMatchday";

const CreateProdeMatchday = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tournamentId, setTournamentId] = useState("");
  const [month, setMonth] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [deadline, setDeadline] = useState("");

  const { data: tournamentsData } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });
  /* Solo torneos no finalizados pueden recibir fechas nuevas */
  const tournaments = useMemo(
    () => (tournamentsData ?? []).filter((t) => t.status !== "finished"),
    [tournamentsData],
  );
  const selectedTournament = tournaments.find((t) => t._id === tournamentId);

  useEffect(() => {
    if (!tournamentId && tournaments.length > 0) {
      const active = tournaments.find((t) => t.status === "active");
      setTournamentId((active ?? tournaments[0])._id);
    }
  }, [tournaments, tournamentId]);

  /* Al cambiar de torneo, resetear el mes si no pertenece al nuevo */
  useEffect(() => {
    if (selectedTournament && !selectedTournament.months.includes(month)) {
      setMonth("");
    }
  }, [tournamentId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Número de fecha sugerido: el siguiente en la secuencia del torneo */
  const { data: matchdaysData } = useQuery({
    queryKey: ["prode-matchdays", tournamentId],
    queryFn: () => fetchProdeMatchdaysByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  useEffect(() => {
    if (matchdaysData) {
      const maxRound = matchdaysData.reduce(
        (max, m) => Math.max(max, m.roundNumber),
        0,
      );
      setRoundNumber(String(maxRound + 1));
    }
  }, [matchdaysData]);

  const mutation = useMutation({
    mutationFn: createProdeMatchday,
    onSuccess: (matchdayCreated) => {
      toast.success("Fecha creada — ahora armá los duelos");
      queryClient.invalidateQueries(["prode-matchdays", tournamentId]);
      navigate(`/admin/prode/fechas/editar/${matchdayCreated._id}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear la fecha");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tournamentId) {
      toast.error("Seleccioná un torneo");
      return;
    }
    if (!month) {
      toast.error("Seleccioná el mes de la fecha");
      return;
    }
    if (!roundNumber || Number(roundNumber) < 1) {
      toast.error("Ingresá el número de fecha");
      return;
    }
    if (!deadline) {
      toast.error("Fijá el deadline de pronósticos");
      return;
    }

    mutation.mutate({
      tournament: tournamentId,
      month,
      roundNumber: Number(roundNumber),
      predictionsDeadline: new Date(deadline).toISOString(),
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
              Prode
            </div>
            <h1 className="prf-title">Crear nueva fecha</h1>
          </div>
          <Link className="prf-back-link" to="/admin/prode/fechas">
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
            <label>Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={!selectedTournament}
              required
            >
              <option value="">
                {selectedTournament
                  ? "Elegí el mes"
                  : "Seleccioná primero un torneo"}
              </option>
              {(selectedTournament?.months ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="prf-field">
            <label>Número de fecha</label>
            <input
              type="number"
              min="1"
              value={roundNumber}
              placeholder="Ej: 12"
              onChange={(e) => setRoundNumber(e.target.value)}
              required
            />
            <p className="prf-hint">
              Sugerido automáticamente: la siguiente en la secuencia del
              torneo. Podés cambiarlo si hace falta.
            </p>
          </div>

          <div className="prf-field">
            <label>Deadline de pronósticos</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <p className="prf-hint">
              Día y hora límite para cargar pronósticos. Si es la primera
              fecha del mes, también cierra los cambios de GDT.
            </p>
          </div>

          <button
            type="submit"
            className="prf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Crear fecha y armar duelos"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateProdeMatchday;
