// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";
import {
  PRODE_MONTHS,
  TOURNAMENT_STATUSES,
  monthsSummary,
  participantsSummary,
} from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import MultiSelectDropdown from "../MultiSelectDropdown";
import InfoTip from "../InfoTip";

//Import React Query functions
import fetchProdeTournamentById from "../../../../reactquery/prode/fetchProdeTournamentById";
import updateProdeTournament from "../../../../reactquery/prode/updateProdeTournament";
import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";

const UpdateProdeTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [months, setMonths] = useState([]);
  const [participants, setParticipants] = useState([]);

  const {
    data: tournament,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-tournament", id],
    queryFn: () => fetchProdeTournamentById(id),
  });

  const { data: playersData } = useQuery({
    queryKey: ["prode-players"],
    queryFn: fetchAllProdePlayers,
  });

  useEffect(() => {
    if (tournament) {
      setName(tournament.name ?? "");
      setYear(tournament.year ?? "");
      setMonths(tournament.months ?? []);
      setParticipants(
        (tournament.participants ?? []).map((p) => p._id ?? p),
      );
    }
  }, [tournament]);

  /* Candidatos: jugadores activos + los ya seleccionados (aunque estén
     inactivos, para no perderlos de la lista al editar). */
  const allPlayers = playersData ?? [];
  const candidates = allPlayers.filter(
    (p) => p.active || participants.includes(p._id),
  );

  const mutation = useMutation({
    mutationFn: updateProdeTournament,
    onSuccess: () => {
      toast.success("Torneo actualizado con éxito");
      queryClient.invalidateQueries(["prode-tournaments"]);
      queryClient.invalidateQueries(["prode-tournament", id]);
      navigate("/admin/prode/torneos");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar el torneo");
    },
  });

  const toggleMonth = (month) => {
    setMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month],
    );
  };

  const toggleParticipant = (playerId) => {
    setParticipants((prev) =>
      prev.includes(playerId)
        ? prev.filter((pid) => pid !== playerId)
        : [...prev, playerId],
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Por favor completá el nombre del torneo");
      return;
    }
    if (months.length === 0) {
      toast.error("Seleccioná al menos un mes");
      return;
    }
    if (participants.length > 0 && participants.length % 2 !== 0) {
      toast.error(
        "La cantidad de participantes debe ser par (los duelos son 1 vs 1)",
      );
      return;
    }

    const orderedMonths = PRODE_MONTHS.filter((m) => months.includes(m));

    mutation.mutate({
      tournamentId: id,
      name: name.trim(),
      year: Number(year),
      months: orderedMonths,
      participants,
    });
  };

  if (isLoading) return <SpinnerOverlay />;
  if (isError) {
    return (
      <div className="prf-page">
        <p className="prf-state">
          {error?.message || "Ocurrió un error al cargar el torneo."}
        </p>
      </div>
    );
  }

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
            <h1 className="prf-title">Editar torneo</h1>
          </div>
          <Link className="prf-back-link" to="/admin/prode/torneos">
            Volver
          </Link>
        </div>

        <form className="prf-form" onSubmit={handleSubmit}>
          <div className="prf-field">
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="prf-field">
            <label>Año</label>
            <input
              type="number"
              value={year}
              min="2020"
              max="2100"
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div className="prf-field">
            <label>
              Estado
              <InfoTip text="El estado ya no se edita acá: se cambia con los botones Activar / Finalizar del índice de torneos." />
            </label>
            <div>
              <span className={`pri-badge pri-badge--${tournament.status}`}>
                {TOURNAMENT_STATUSES.find(
                  (s) => s.value === tournament.status,
                )?.label ?? tournament.status}
              </span>
            </div>
          </div>

          <div className="prf-field">
            <label>Meses del torneo</label>
            <MultiSelectDropdown
              placeholder="Elegí los meses"
              summary={monthsSummary(months)}
              options={PRODE_MONTHS.map((m) => ({ value: m, label: m }))}
              selected={months}
              onToggle={toggleMonth}
            />
          </div>

          <div className="prf-field">
            <label>Participantes</label>
            {candidates.length === 0 ? (
              <p className="prf-hint">
                No hay jugadores activos. Crealos primero en la sección
                Jugadores.
              </p>
            ) : (
              <>
                <MultiSelectDropdown
                  placeholder="Elegí los participantes"
                  summary={participantsSummary(participants)}
                  options={candidates.map((p) => ({
                    value: p._id,
                    label: p.name,
                  }))}
                  selected={participants}
                  onToggle={toggleParticipant}
                />
                <p className="prf-hint">
                  {participants.length} seleccionados
                  {participants.length % 2 !== 0
                    ? " — la cantidad debe ser par"
                    : ` (${participants.length / 2} duelos por fecha)`}
                </p>
              </>
            )}
          </div>

          <button
            type="submit"
            className="prf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdateProdeTournament;
