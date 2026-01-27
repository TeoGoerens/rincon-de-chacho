import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchProdePlayerById from "../../../../reactquery/prode/fetchProdePlayerById";
import updateProdePlayer from "../../../../reactquery/prode/updateProdePlayer";

const UpdateProdePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: player,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchProdePlayerById", id],
    queryFn: () => fetchProdePlayerById(id),
  });

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (player) {
      setName(player.name || "");
      setActive(Boolean(player.active));
    }
  }, [player]);

  const mutation = useMutation({
    mutationFn: updateProdePlayer,
    onSuccess: () => {
      toast.success("Jugador actualizado con éxito");
      queryClient.invalidateQueries(["fetchAllProdePlayers"]);
      navigate("/admin/prode");
    },
    onError: (err) => {
      toast.error(`❌ Error al actualizar jugador: ${err.message || err}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    mutation.mutate({ playerId: id, name: name.trim(), active });
  };

  if (isLoading) {
    return (
      <div className="prode-page">
        <div className="prode-page-header">
          <h2>Editar jugador</h2>
          <Link className="prode-secondary-btn" to="/admin/prode">
            <i className="fa-solid fa-arrow-left"></i>
            Volver
          </Link>
        </div>
        <p>Cargando jugador...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="prode-page">
        <div className="prode-page-header">
          <h2>Editar jugador</h2>
          <Link className="prode-secondary-btn" to="/admin/prode">
            <i className="fa-solid fa-arrow-left"></i>
            Volver
          </Link>
        </div>
        <p>❌ Error: {error?.message || "No se pudo cargar el jugador"}</p>
      </div>
    );
  }

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Editar jugador</h2>

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
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="prode-form-actions">
            <button
              type="submit"
              className="prode-submit-btn"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProdePlayer;
