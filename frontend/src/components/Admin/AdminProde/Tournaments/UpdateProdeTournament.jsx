import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchProdeConstants from "../../../../reactquery/prode/fetchProdeConstants";
import fetchProdeTournamentById from "../../../../reactquery/prode/fetchProdeTournamentById";
import updateProdeTournament from "../../../../reactquery/prode/updateProdeTournament";

import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";
import updateProdeMonthlyWinners from "../../../../reactquery/prode/updateProdeMonthlyWinners";
import deleteProdeMonthlyWinnersByMonth from "../../../../reactquery/prode/deleteProdeMonthlyWinnersByMonth";

const UpdateProdeTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* -------------------- QUERIES -------------------- */
  const {
    data: constants,
    isLoading: isLoadingConstants,
    isError: isErrorConstants,
    error: errorConstants,
  } = useQuery({
    queryKey: ["fetchProdeConstants"],
    queryFn: fetchProdeConstants,
  });

  const months = useMemo(() => constants?.months || [], [constants]);
  const tournamentStatuses = useMemo(
    () => constants?.tournamentStatuses || ["draft", "active", "finished"],
    [constants],
  );

  const {
    data: tournament,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchProdeTournamentById", id],
    queryFn: () => fetchProdeTournamentById(id),
    enabled: Boolean(id),
  });

  const {
    data: players,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    error: errorPlayers,
  } = useQuery({
    queryKey: ["fetchAllProdePlayers"],
    queryFn: fetchAllProdePlayers,
  });

  /* -------------------- STATE: TOURNAMENT -------------------- */
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("draft");
  const [selectedMonths, setSelectedMonths] = useState([]);

  useEffect(() => {
    if (!tournament) return;

    setName(tournament.name || "");
    setYear(tournament.year || new Date().getFullYear());
    setStatus(tournament.status || "draft");
    setSelectedMonths(
      Array.isArray(tournament.months) ? tournament.months : [],
    );
  }, [tournament]);

  const toggleMonth = (month) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) return prev.filter((m) => m !== month);
      return [...prev, month];
    });
  };

  const handleSelectAllMonths = () => setSelectedMonths(months);
  const handleClearMonths = () => setSelectedMonths([]);

  /* -------------------- MUTATION: UPDATE TOURNAMENT -------------------- */
  const mutation = useMutation({
    mutationFn: updateProdeTournament,
    onSuccess: () => {
      toast.success("Torneo actualizado con éxito");
      queryClient.invalidateQueries(["fetchAllProdeTournaments"]);
      queryClient.invalidateQueries(["fetchProdeTournamentById", id]);
      navigate("/admin/prode/torneos");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || err;
      toast.error(`❌ Error al actualizar torneo: ${msg}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre del torneo es obligatorio");
      return;
    }

    if (!year || Number.isNaN(Number(year))) {
      toast.error("El año es obligatorio y debe ser numérico");
      return;
    }

    if (!Array.isArray(selectedMonths) || selectedMonths.length === 0) {
      toast.error("Tenés que seleccionar al menos un mes");
      return;
    }

    mutation.mutate({
      tournamentId: id,
      name: name.trim(),
      year: Number(year),
      status,
      months: selectedMonths,
    });
  };

  /* ==========================================================
     MONTHLY WINNERS (MANUAL)
     backend:
       PUT    /tournament/:id/monthly-winners
       DELETE /tournament/:id/monthly-winners/:month
  ========================================================== */

  const [selectedMWMonth, setSelectedMWMonth] = useState("");
  const [mwWinners, setMwWinners] = useState(["", "", "", ""]); // puestos 1..4
  const [mwNote, setMwNote] = useState("");

  // Mes default: primer mes habilitado del torneo
  useEffect(() => {
    if (!tournament) return;
    if (selectedMWMonth) return;

    const first =
      Array.isArray(tournament.months) && tournament.months.length > 0
        ? tournament.months[0]
        : "";

    setSelectedMWMonth(first);
  }, [tournament, selectedMWMonth]);

  // Precarga winners cuando cambia el mes elegido
  useEffect(() => {
    if (!tournament || !selectedMWMonth) return;

    const existing = tournament.monthlyWinners?.find(
      (mw) => mw.month === selectedMWMonth,
    );

    if (existing) {
      const normalized = (existing.winnerPlayerIds || []).map(
        (p) => p?._id || p || "",
      );

      setMwWinners([
        normalized[0] || "",
        normalized[1] || "",
        normalized[2] || "",
        normalized[3] || "",
      ]);
      setMwNote(existing.note || "");
    } else {
      setMwWinners(["", "", "", ""]);
      setMwNote("");
    }
  }, [tournament, selectedMWMonth]);

  const setWinner = (index, value) => {
    setMwWinners((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const validateMonthlyWinners = () => {
    if (!selectedMWMonth) {
      toast.error("Seleccioná un mes");
      return false;
    }

    if (
      !Array.isArray(selectedMonths) ||
      !selectedMonths.includes(selectedMWMonth)
    ) {
      toast.error(
        "Ese mes no está habilitado en el torneo. Habilitalo arriba primero.",
      );
      return false;
    }

    if (mwWinners.some((x) => !x)) {
      toast.error("Tenés que completar los 4 puestos");
      return false;
    }

    const unique = new Set(mwWinners);
    if (unique.size !== 4) {
      toast.error("Los 4 jugadores deben ser distintos");
      return false;
    }

    return true;
  };

  const mwMutation = useMutation({
    mutationFn: updateProdeMonthlyWinners,
    onSuccess: () => {
      toast.success("Monthly winners guardados");
      queryClient.invalidateQueries(["fetchProdeTournamentById", id]);
      queryClient.invalidateQueries(["fetchAllProdeTournaments"]);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al guardar monthly winners";
      toast.error(`❌ ${msg}`);
    },
  });

  const mwDeleteMutation = useMutation({
    mutationFn: deleteProdeMonthlyWinnersByMonth,
    onSuccess: () => {
      toast.success("Monthly winners eliminados para ese mes");
      queryClient.invalidateQueries(["fetchProdeTournamentById", id]);
      queryClient.invalidateQueries(["fetchAllProdeTournaments"]);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al eliminar monthly winners";
      toast.error(`❌ ${msg}`);
    },
  });

  const handleSaveMonthlyWinners = () => {
    if (!validateMonthlyWinners()) return;

    mwMutation.mutate({
      tournamentId: id,
      month: selectedMWMonth,
      winnerPlayerIds: mwWinners,
      note: mwNote?.trim() || "",
    });
  };

  const handleDeleteMonthlyWinners = () => {
    if (!selectedMWMonth) {
      toast.error("Seleccioná un mes");
      return;
    }

    mwDeleteMutation.mutate({
      tournamentId: id,
      month: selectedMWMonth,
    });
  };

  /* -------------------- LOADING / ERROR -------------------- */
  if (isLoading) {
    return (
      <div className="prode-page">
        <p>Cargando torneo...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="prode-page">
        <p>❌ Error: {error?.message || "No se pudo cargar el torneo"}</p>
        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Editar torneo</h2>

        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          <i className="fa-solid fa-arrow-left"></i>
          Volver
        </Link>
      </div>

      <form className="prode-form" onSubmit={handleSubmit}>
        {/* =========================
            TOURNAMENT META
        ========================= */}
        <label>Nombre</label>
        <input
          type="text"
          placeholder="Ej: Prode Apertura 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Año</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />

        <label>Estado</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {tournamentStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="prode-form-section">
          <div className="prode-form-section-head">
            <label style={{ margin: 0 }}>Meses del torneo</label>

            <div className="prode-inline-actions">
              <button
                type="button"
                className="prode-secondary-btn"
                onClick={handleSelectAllMonths}
                disabled={isLoadingConstants || months.length === 0}
              >
                Seleccionar todos
              </button>

              <button
                type="button"
                className="prode-secondary-btn"
                onClick={handleClearMonths}
                disabled={selectedMonths.length === 0}
              >
                Limpiar
              </button>
            </div>
          </div>

          {isErrorConstants && (
            <p>❌ Error constants: {errorConstants?.message}</p>
          )}

          <div className="prode-pills-container prode-pills-clickable">
            {months.map((m) => {
              const active = selectedMonths.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(m)}
                  className={`prode-pill prode-pill-clickable ${
                    active ? "prode-pill-active prode-pill-selected" : ""
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <p className="prode-help">
            Ojo: si desmarcás un mes, después no vas a poder asignar fechas a
            ese mes en este torneo (y tampoco cargar “monthly winners” para ese
            mes).
          </p>
        </div>

        <button
          type="submit"
          className="prode-submit-btn"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Guardando..." : "Guardar cambios"}
        </button>

        {/* =========================
            DIVISOR
        ========================= */}
        <hr className="prode-divider" />

        {/* =========================
            MONTHLY WINNERS (MANUAL)
        ========================= */}
        <div className="prode-form-section">
          <div className="prode-form-section-head">
            <label style={{ margin: 0 }}>Monthly winners (manual)</label>

            <div className="prode-inline-actions">
              <button
                type="button"
                className="prode-secondary-btn"
                onClick={handleSaveMonthlyWinners}
                disabled={mwMutation.isPending || isLoadingPlayers}
              >
                {mwMutation.isPending ? "Guardando..." : "Guardar mes"}
              </button>

              <button
                type="button"
                className="prode-secondary-btn"
                onClick={handleDeleteMonthlyWinners}
                disabled={mwDeleteMutation.isPending || !selectedMWMonth}
              >
                {mwDeleteMutation.isPending ? "Eliminando..." : "Eliminar mes"}
              </button>
            </div>
          </div>

          <p className="prode-help">
            Manual: puede haber empates/definiciones no codeables (moneda,
            criterio, etc). Se carga por mes.
          </p>

          <label>Mes</label>
          <div className="prode-pills-container prode-pills-clickable">
            {(selectedMonths || []).length === 0 && (
              <span className="prode-help">
                Primero habilitá meses arriba para poder cargar winners.
              </span>
            )}

            {(selectedMonths || []).map((m) => {
              const isSelected = selectedMWMonth === m;
              return (
                <button
                  type="button"
                  key={m}
                  className={`prode-pill prode-pill-clickable ${
                    isSelected ? "prode-pill-selected prode-pill-active" : ""
                  }`}
                  onClick={() => setSelectedMWMonth(m)}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {isLoadingPlayers && <p>Cargando jugadores...</p>}
          {isErrorPlayers && <p>❌ Error: {errorPlayers?.message}</p>}

          {!isLoadingPlayers && !isErrorPlayers && (
            <>
              <div className="prode-grid-2">
                <div>
                  <label>Puesto 1</label>
                  <select
                    value={mwWinners[0]}
                    onChange={(e) => setWinner(0, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {players?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Puesto 2</label>
                  <select
                    value={mwWinners[1]}
                    onChange={(e) => setWinner(1, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {players?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Puesto 3</label>
                  <select
                    value={mwWinners[2]}
                    onChange={(e) => setWinner(2, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {players?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Puesto 4</label>
                  <select
                    value={mwWinners[3]}
                    onChange={(e) => setWinner(3, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {players?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Nota (opcional)</label>
              <textarea
                className="prode-textarea"
                rows={3}
                value={mwNote}
                onChange={(e) => setMwNote(e.target.value)}
                placeholder="Ej: Empate en el 4to puesto implicó desempate por mejor puntaje entre ellos"
              />
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default UpdateProdeTournament;
