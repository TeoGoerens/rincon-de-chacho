import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchProdeConstants from "../../../../reactquery/prode/fetchProdeConstants";
import createProdeTournament from "../../../../reactquery/prode/createProdeTournament";

const CreateProdeTournament = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: constants, isLoading: isLoadingConstants } = useQuery({
    queryKey: ["fetchProdeConstants"],
    queryFn: fetchProdeConstants,
  });

  const months = useMemo(() => constants?.months || [], [constants]);
  const tournamentStatuses = useMemo(
    () => constants?.tournamentStatuses || ["draft", "active", "finished"],
    [constants],
  );

  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("draft");
  const [selectedMonths, setSelectedMonths] = useState([]);

  const mutation = useMutation({
    mutationFn: createProdeTournament,
    onSuccess: () => {
      toast.success("Torneo creado con éxito");
      queryClient.invalidateQueries(["fetchAllProdeTournaments"]);
      navigate("/admin/prode/torneos");
    },
    onError: (err) => {
      toast.error(`❌ Error al crear torneo: ${err?.message || err}`);
    },
  });

  const toggleMonth = (month) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) return prev.filter((m) => m !== month);
      return [...prev, month];
    });
  };

  const handleSelectAllMonths = () => setSelectedMonths(months);
  const handleClearMonths = () => setSelectedMonths([]);

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
      name: name.trim(),
      year: Number(year),
      months: selectedMonths,
      status,
    });
  };

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Crear torneo</h2>

        <Link className="prode-primary-btn" to="/admin/prode/torneos">
          <i className="fa-solid fa-arrow-left"></i>
          Volver
        </Link>
      </div>

      <form className="prode-form" onSubmit={handleSubmit}>
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

          {isLoadingConstants ? (
            <p>Cargando meses...</p>
          ) : (
            <div className="prode-pills-container prode-pills-clickable">
              {months.map((m) => {
                const isSelected = selectedMonths.includes(m);

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`prode-pill prode-pill-clickable ${
                      isSelected ? "prode-pill-selected" : ""
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          <p className="prode-help">
            Tip: estos meses son “meses del torneo” (no necesariamente el mes
            cronológico). Los vas a elegir manualmente al cargar cada fecha.
          </p>
        </div>

        <button
          type="submit"
          className="prode-submit-btn"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creando..." : "Crear torneo"}
        </button>
      </form>
    </div>
  );
};

export default CreateProdeTournament;
