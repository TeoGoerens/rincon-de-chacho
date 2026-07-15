// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import { GDT_POSITION_OPTIONS } from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchGdtRealPlayerById from "../../../../reactquery/prode/fetchGdtRealPlayerById";
import fetchGdtUniversePlayers from "../../../../reactquery/prode/fetchGdtUniversePlayers";
import updateGdtRealPlayer from "../../../../reactquery/prode/updateGdtRealPlayer";

const UpdateGdtPlayer = () => {
  const { universeId, id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [newClub, setNewClub] = useState("");
  const [position, setPosition] = useState("");

  /* Clubes existentes del pool: el club se elige de lista para no crear
     un "club extra" por un typo (transferencias = elegir club existente) */
  const { data: poolData } = useQuery({
    queryKey: ["gdt-universe-players", universeId],
    queryFn: () => fetchGdtUniversePlayers(universeId),
  });
  const clubs = useMemo(
    () => [...new Set((poolData ?? []).map((p) => p.club))].sort(),
    [poolData],
  );

  const {
    data: player,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["gdt-real-player", id],
    queryFn: () => fetchGdtRealPlayerById(id),
  });

  useEffect(() => {
    if (player) {
      setName(player.name ?? "");
      setClub(player.club ?? "");
      setPosition(player.position ?? "");
    }
  }, [player]);

  const mutation = useMutation({
    mutationFn: updateGdtRealPlayer,
    onSuccess: (data) => {
      toast.success("Jugador actualizado");
      /* La edición (transferencia de club, corrección de posición) puede
         generar inconsistencias en planteles vigentes: se avisan acá para
         que el admin considere el bloqueo puntual */
      for (const impact of data?.impacts ?? []) {
        toast.warn(`${impact} — considerá el bloqueo puntual`, {
          autoClose: false,
        });
      }
      /* Chequeo inverso: bloqueos que quedaron sin motivo tras la edición */
      for (const suggestion of data?.unblockSuggestions ?? []) {
        toast.info(suggestion, { autoClose: false });
      }
      queryClient.invalidateQueries(["gdt-universe-players", universeId]);
      queryClient.invalidateQueries(["gdt-real-player", id]);
      queryClient.invalidateQueries(["gdt-admin-squads", universeId]);
      navigate(`/admin/prode/gdt/${universeId}`);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al actualizar el jugador");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const clubValue = club === "__new__" ? newClub.trim() : club.trim();
    if (!name.trim() || !clubValue || !position) {
      toast.error("Completá nombre, club y posición");
      return;
    }

    mutation.mutate({
      playerId: id,
      player: { name: name.trim(), club: clubValue, position },
    });
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
              Prode · Gran DT · {player?.league}
            </div>
            <h1 className="prf-title">Editar jugador</h1>
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
              <p className="prf-hint">
                Elegir de la lista evita duplicar un club por un typo.
              </p>
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
            {player?.providerPlayerId
              ? "Jugador importado desde la API."
              : "Jugador cargado a mano en este universo."}
          </p>

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

export default UpdateGdtPlayer;
