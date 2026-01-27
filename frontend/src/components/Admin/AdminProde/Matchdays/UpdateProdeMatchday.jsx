import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchProdeMatchdayById from "../../../../reactquery/prode/fetchProdeMatchdayById";
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeConstants from "../../../../reactquery/prode/fetchProdeConstants";
import updateProdeMatchdayMeta from "../../../../reactquery/prode/updateProdeMatchdayMeta";

const UpdateProdeMatchday = () => {
  const { id } = useParams();
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

  const {
    data: matchday,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchProdeMatchdayById", id],
    queryFn: () => fetchProdeMatchdayById(id),
  });

  const [tournamentId, setTournamentId] = useState("");
  const [month, setMonth] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [status, setStatus] = useState("scheduled");

  useEffect(() => {
    if (matchday) {
      setTournamentId(matchday.tournament?._id || matchday.tournament || "");
      setMonth(matchday.month || "");
      setRoundNumber(matchday.roundNumber || 1);
      setStatus(matchday.status || "scheduled");
    }
  }, [matchday]);

  const selectedTournament = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return null;
    const found = tournaments.find((t) => t._id === tournamentId);
    return found || tournaments[0];
  }, [tournaments, tournamentId]);

  const enabledMonths = selectedTournament?.months || [];
  const allMonths = constants?.months || [];
  const monthsToShow = useMemo(() => {
    if (!enabledMonths || enabledMonths.length === 0) return allMonths;
    return allMonths.filter((m) => enabledMonths.includes(m));
  }, [allMonths, enabledMonths]);

  const mutation = useMutation({
    mutationFn: updateProdeMatchdayMeta,
    onSuccess: () => {
      toast.success("Fecha actualizada con éxito");
      queryClient.invalidateQueries(["fetchProdeMatchdayById", id]);
      queryClient.invalidateQueries(["fetchProdeMatchdaysByTournament"]);
      navigate("/admin/prode/fechas");
    },
    onError: (err) => {
      toast.error(`❌ Error al actualizar fecha: ${err.message || err}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!tournamentId) {
      toast.error("Seleccioná un torneo.");
      return;
    }
    if (!month) {
      toast.error("Seleccioná un mes.");
      return;
    }

    const payload = {
      matchdayId: id,
      tournament: tournamentId,
      month,
      roundNumber: Number(roundNumber),
      status,
    };

    mutation.mutate(payload);
  };

  if (isLoading) return <p>Cargando fecha...</p>;
  if (isError) return <p>❌ Error: {error?.message}</p>;

  return (
    <div className="prode-page">
      <div className="prode-form-head">
        <h2 className="prode-title">Editar fecha</h2>

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
            value={tournamentId}
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
          <div className="prode-pills-container">
            {monthsToShow.map((m) => {
              const isSelected = month === m;
              return (
                <button
                  type="button"
                  key={m}
                  className={`prode-pill ${isSelected ? "prode-pill-selected" : ""}`}
                  onClick={() => setMonth(m)}
                >
                  {m}
                </button>
              );
            })}
          </div>

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
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      )}
    </div>
  );
};

export default UpdateProdeMatchday;
