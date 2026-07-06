// Import React dependencies
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdePlayerById from "../../../../reactquery/prode/fetchProdePlayerById";
import updateProdePlayer from "../../../../reactquery/prode/updateProdePlayer";

const UpdateProdePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const {
    data: player,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-player", id],
    queryFn: () => fetchProdePlayerById(id),
  });

  useEffect(() => {
    if (player) {
      setName(player.name ?? "");
      setActive(player.active ?? true);
    }
  }, [player]);

  const mutation = useMutation({
    mutationFn: updateProdePlayer,
    onSuccess: () => {
      toast.success("Jugador actualizado con éxito");
      queryClient.invalidateQueries(["prode-players"]);
      queryClient.invalidateQueries(["prode-player", id]);
      navigate("/admin/prode/jugadores");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar el jugador");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Por favor completá el nombre del jugador");
      return;
    }

    mutation.mutate({ playerId: id, name: name.trim(), active });
  };

  if (isLoading) return <SpinnerOverlay />;
  if (isError) {
    return (
      <div className="prf-page">
        <p className="prf-state">
          {error?.message || "Ocurrió un error al cargar el jugador."}
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
            <h1 className="prf-title">Editar jugador</h1>
          </div>
          <Link className="prf-back-link" to="/admin/prode/jugadores">
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
            <label>Estado</label>
            <div className="prf-chips">
              <button
                type="button"
                className={`prf-chip${active ? " prf-chip--selected" : ""}`}
                onClick={() => setActive(true)}
              >
                Activo
              </button>
              <button
                type="button"
                className={`prf-chip${!active ? " prf-chip--selected" : ""}`}
                onClick={() => setActive(false)}
              >
                Inactivo
              </button>
            </div>
            <p className="prf-hint">
              Un jugador inactivo conserva todo su historial pero no aparece
              como candidato para nuevos torneos.
            </p>
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

export default UpdateProdePlayer;
