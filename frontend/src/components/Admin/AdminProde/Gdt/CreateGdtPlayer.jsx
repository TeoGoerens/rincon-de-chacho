// Import React dependencies
import React, { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import { GDT_POSITION_OPTIONS } from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import createGdtRealPlayer from "../../../../reactquery/prode/createGdtRealPlayer";
import fetchGdtUniverseById from "../../../../reactquery/prode/fetchGdtUniverseById";
import fetchGdtUniversePlayers from "../../../../reactquery/prode/fetchGdtUniversePlayers";

/* Alta manual al POOL de un universo GDT (para jugadores que la API no trae) */
const CreateGdtPlayer = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [newClub, setNewClub] = useState("");
  const [position, setPosition] = useState("");

  const { data: team } = useQuery({
    queryKey: ["gdt-universe", universeId],
    queryFn: () => fetchGdtUniverseById(universeId),
  });

  /* Clubes existentes del pool: elegir de lista evita crear un "club
     extra" por un typo (la regla 1-por-club compara por ese texto) */
  const { data: poolData } = useQuery({
    queryKey: ["gdt-universe-players", universeId],
    queryFn: () => fetchGdtUniversePlayers(universeId),
  });
  const clubs = useMemo(
    () => [...new Set((poolData ?? []).map((p) => p.club))].sort(),
    [poolData],
  );

  const mutation = useMutation({
    mutationFn: createGdtRealPlayer,
    onSuccess: () => {
      toast.success("Jugador agregado al pool");
      queryClient.invalidateQueries(["gdt-universe-players", universeId]);
      navigate(`/admin/prode/gdt/${universeId}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el jugador");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const clubValue = club === "__new__" ? newClub.trim() : club.trim();
    if (!name.trim()) {
      toast.error("Completá el nombre del jugador");
      return;
    }
    if (!clubValue) {
      toast.error("Completá el club del jugador");
      return;
    }
    if (!position) {
      toast.error("Elegí la posición del jugador");
      return;
    }

    mutation.mutate({
      universeId,
      player: { name: name.trim(), club: clubValue, position },
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
              Prode · Gran DT{team ? ` · ${team.label}` : ""}
            </div>
            <h1 className="prf-title">Agregar jugador al pool</h1>
          </div>
          <Link className="prf-back-link" to={`/admin/prode/gdt/${universeId}`}>
            Volver
          </Link>
        </div>

        <form className="prf-form" onSubmit={handleSubmit}>
          <div className="prf-field">
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              placeholder="Ej: Miguel Borja"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="prf-player-row">
            <div className="prf-field">
              <label>Club</label>
              <select
                value={club}
                onChange={(e) => setClub(e.target.value)}
                required
              >
                <option value="">Elegí el club</option>
                {clubs.map((clubName) => (
                  <option key={clubName} value={clubName}>
                    {clubName}
                  </option>
                ))}
                <option value="__new__">Otro club (escribirlo)</option>
              </select>
              {club === "__new__" && (
                <input
                  type="text"
                  value={newClub}
                  onChange={(e) => setNewClub(e.target.value)}
                  placeholder="Nombre exacto del club nuevo"
                  required
                />
              )}
            </div>
            <div className="prf-field">
              <label>Posición</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              >
                <option value="">Elegí la posición</option>
                {GDT_POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="prf-hint">
            Elegir el club de la lista evita duplicarlo por un typo (la
            regla "1 por club" compara por ese texto). La liga es la del
            universo{team ? `: ${team.league}` : ""}.
          </p>

          <button
            type="submit"
            className="prf-submit-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Agregar jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateGdtPlayer;
