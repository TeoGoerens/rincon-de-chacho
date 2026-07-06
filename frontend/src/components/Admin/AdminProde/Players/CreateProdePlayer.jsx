// Import React dependencies
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import createProdePlayer from "../../../../reactquery/prode/createProdePlayer";

const CreateProdePlayer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: createProdePlayer,
    onSuccess: () => {
      toast.success("Jugador creado con éxito");
      queryClient.invalidateQueries(["prode-players"]);
      navigate("/admin/prode/jugadores");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el jugador");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Por favor completá el nombre del jugador");
      return;
    }

    mutation.mutate({ name: name.trim(), active: true });
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
            <h1 className="prf-title">Crear nuevo jugador</h1>
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
              placeholder="Ej: Teo"
              onChange={(e) => setName(e.target.value)}
              required
            />
            <p className="prf-hint">
              El jugador se crea activo y disponible para ser participante de
              torneos.
            </p>
          </div>

          <button
            type="submit"
            className="prf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Crear jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateProdePlayer;
