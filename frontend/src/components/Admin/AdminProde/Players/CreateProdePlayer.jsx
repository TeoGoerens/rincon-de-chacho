import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import createProdePlayer from "../../../../reactquery/prode/createProdePlayer";

const CreateProdePlayer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const mutation = useMutation({
    mutationFn: createProdePlayer,
    onSuccess: () => {
      toast.success("Jugador creado con éxito");
      queryClient.invalidateQueries(["fetchAllProdePlayers"]);
      navigate("/admin/prode");
    },
    onError: (error) => {
      toast.error(`❌ Error al crear jugador: ${error.message || error}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    mutation.mutate({ name: name.trim(), active });
  };

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Crear jugador</h2>

        <Link className="prode-secondary-btn" to="/admin/prode">
          <i className="fa-solid fa-arrow-left"></i>
          Volver
        </Link>
      </div>

      <div className="prode-form-card">
        <form className="prode-form" onSubmit={handleSubmit}>
          <div className="prode-form-row">
            <label className="prode-label">Nombre</label>
            <input
              className="prode-input"
              type="text"
              value={name}
              placeholder="Ej: Teo"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="prode-form-row">
            <label className="prode-label">Activo</label>
            <select
              className="prode-select"
              value={active ? "true" : "false"}
              onChange={(e) => setActive(e.target.value === "true")}
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="prode-form-actions">
            <button
              type="submit"
              className="prode-submit-btn"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creando..." : "Crear jugador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProdePlayer;
