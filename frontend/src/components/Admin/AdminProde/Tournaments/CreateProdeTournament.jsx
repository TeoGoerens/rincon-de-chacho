// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import { PRODE_MONTHS } from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import createProdeTournament from "../../../../reactquery/prode/createProdeTournament";
import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";

const CreateProdeTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState([]);
  const [participants, setParticipants] = useState([]);

  const { data: playersData } = useQuery({
    queryKey: ["prode-players"],
    queryFn: fetchAllProdePlayers,
  });
  const availablePlayers = (playersData ?? []).filter((p) => p.active);

  const mutation = useMutation({
    mutationFn: createProdeTournament,
    onSuccess: () => {
      toast.success("Torneo creado con éxito");
      queryClient.invalidateQueries(["prode-tournaments"]);
      navigate("/admin/prode/torneos");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el torneo");
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
        ? prev.filter((id) => id !== playerId)
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

    /* Los meses se guardan en orden calendario, no en orden de click */
    const orderedMonths = PRODE_MONTHS.filter((m) => months.includes(m));

    mutation.mutate({
      name: name.trim(),
      year: Number(year),
      months: orderedMonths,
      participants,
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
            <h1 className="prf-title">Crear nuevo torneo</h1>
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
              placeholder="Ej: Apertura 2026"
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
            <label>Meses del torneo</label>
            <div className="prf-chips">
              {PRODE_MONTHS.map((month) => (
                <button
                  key={month}
                  type="button"
                  className={`prf-chip${
                    months.includes(month) ? " prf-chip--selected" : ""
                  }`}
                  onClick={() => toggleMonth(month)}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div className="prf-field">
            <label>Participantes</label>
            {availablePlayers.length === 0 ? (
              <p className="prf-hint">
                No hay jugadores activos. Crealos primero en la sección
                Jugadores.
              </p>
            ) : (
              <>
                <div className="prf-chips">
                  {availablePlayers.map((player) => (
                    <button
                      key={player._id}
                      type="button"
                      className={`prf-chip${
                        participants.includes(player._id)
                          ? " prf-chip--selected"
                          : ""
                      }`}
                      onClick={() => toggleParticipant(player._id)}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
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
            {mutation.isPending ? "Creando..." : "Crear torneo"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateProdeTournament;
