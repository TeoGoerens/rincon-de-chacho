import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeConstants from "../../../../reactquery/prode/fetchProdeConstants";
import createProdeMatchday from "../../../../reactquery/prode/createProdeMatchday";

const CreateProdeMatchday = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: constants } = useQuery({
    queryKey: ["fetchProdeConstants"],
    queryFn: fetchProdeConstants,
  });

  const {
    data: tournaments,
    isLoading: isLoadingTournaments,
    isError: isErrorTournaments,
    error: errorTournaments,
  } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const [tournamentId, setTournamentId] = useState("");
  const [month, setMonth] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [status, setStatus] = useState("scheduled");

  const selectedTournament = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return null;
    const idToUse = tournamentId || tournaments[0]._id;
    return tournaments.find((t) => t._id === idToUse) || tournaments[0];
  }, [tournaments, tournamentId]);

  const enabledMonths = selectedTournament?.months || [];
  const allMonths = constants?.months || [];

  const monthsToShow = useMemo(() => {
    if (!enabledMonths || enabledMonths.length === 0) return allMonths;
    return allMonths.filter((m) => enabledMonths.includes(m));
  }, [allMonths, enabledMonths]);

  const mutation = useMutation({
    mutationFn: createProdeMatchday,
    onSuccess: () => {
      toast.success("Fecha creada con éxito");
      queryClient.invalidateQueries(["fetchProdeMatchdaysByTournament"]);
      navigate("/admin/prode/fechas");
    },
    onError: (err) => {
      toast.error(`❌ Error al crear fecha: ${err.message || err}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalTournamentId = selectedTournament?._id;

    if (!finalTournamentId) {
      toast.error("Tenés que tener al menos un torneo creado.");
      return;
    }

    if (!month) {
      toast.error("Seleccioná un mes.");
      return;
    }

    const payload = {
      tournament: finalTournamentId,
      month,
      roundNumber: Number(roundNumber),
      status,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="prode-page">
      <div className="prode-form-head">
        <h2 className="prode-title">Crear fecha</h2>

        <Link className="back-btn" to="/admin/prode/fechas">
          <i className="fa-solid fa-arrow-left"></i> Volver
        </Link>
      </div>

      {isLoadingTournaments && <p>Cargando torneos...</p>}
      {isErrorTournaments && <p>❌ Error: {errorTournaments?.message}</p>}

      {!isLoadingTournaments && !isErrorTournaments && (
        <form className="prode-form" onSubmit={handleSubmit}>
          <label>Torneo</label>
          <select
            value={selectedTournament?._id || ""}
            onChange={(e) => {
              setTournamentId(e.target.value);
              setMonth("");
            }}
            required
          >
            {tournaments?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.year})
              </option>
            ))}
          </select>

          <label>Mes</label>
          <div className="prode-pills-container prode-pills-clickable">
            {monthsToShow.map((m) => {
              const isSelected = month === m;
              return (
                <button
                  type="button"
                  key={m}
                  className={`prode-pill prode-pill-clickable ${
                    isSelected ? "prode-pill-selected" : ""
                  }`}
                  onClick={() => setMonth(m)}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <p className="prode-help">
            Solo mostramos meses habilitados en el torneo. Si querés cambiar
            eso, editás el torneo.
          </p>

          <label>Número de ronda</label>
          <input
            type="number"
            min="1"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            required
          />

          <label>Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {(constants?.matchdayStatuses || ["scheduled", "played"]).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>

          <button
            type="submit"
            className="prode-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Crear fecha"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateProdeMatchday;
