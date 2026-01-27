import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchProdeMatchdayById from "../../../../reactquery/prode/fetchProdeMatchdayById";
import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";
import updateProdeMatchdayFull from "../../../../reactquery/prode/updateProdeMatchdayFull";

const CHALLENGE_TYPES = ["GDT", "ARG", "MISC"];

const emptyDuel = () => ({
  playerA: "",
  playerB: "",
  challenges: CHALLENGE_TYPES.map((t) => ({
    type: t,
    scoreA: "",
    scoreB: "",
  })),
});

const UpdateProdeMatchdayFull = () => {
  const { id } = useParams(); // ✅ :id
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: matchday,
    isLoading: isLoadingMatchday,
    isError: isErrorMatchday,
    error: errorMatchday,
  } = useQuery({
    queryKey: ["fetchProdeMatchdayById", id],
    queryFn: () => fetchProdeMatchdayById(id),
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

  const [status, setStatus] = useState("scheduled");
  const [duels, setDuels] = useState([emptyDuel()]);

  useEffect(() => {
    if (!matchday) return;

    setStatus(matchday.status || "scheduled");

    if (Array.isArray(matchday.duels) && matchday.duels.length > 0) {
      // Normalizamos lo que venga del back (populado o ids)
      const normalized = matchday.duels.map((d) => ({
        playerA: d.playerA?._id || d.playerA || "",
        playerB: d.playerB?._id || d.playerB || "",
        challenges: CHALLENGE_TYPES.map((t) => {
          const found = d.challenges?.find((c) => c.type === t);
          return {
            type: t,
            scoreA:
              found?.scoreA === null || found?.scoreA === undefined
                ? ""
                : String(found.scoreA),
            scoreB:
              found?.scoreB === null || found?.scoreB === undefined
                ? ""
                : String(found.scoreB),
          };
        }),
      }));
      setDuels(normalized);
    } else {
      setDuels([emptyDuel()]);
    }
  }, [matchday]);

  const playersOptions = useMemo(() => players || [], [players]);

  const mutation = useMutation({
    mutationFn: updateProdeMatchdayFull,
    onSuccess: () => {
      toast.success("Fecha (FULL) guardada correctamente");
      queryClient.invalidateQueries(["fetchProdeMatchdayById", id]);
      queryClient.invalidateQueries(["fetchProdeMatchdaysByTournament"]);
      navigate("/admin/prode/fechas");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Error al guardar FULL";
      toast.error(`❌ Error al guardar FULL: ${msg}`);
    },
  });

  const addDuel = () => setDuels((prev) => [...prev, emptyDuel()]);

  const removeDuel = (index) =>
    setDuels((prev) => prev.filter((_, i) => i !== index));

  const setDuelField = (index, field, value) => {
    setDuels((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const setChallengeScore = (duelIndex, cType, side, value) => {
    setDuels((prev) =>
      prev.map((d, i) => {
        if (i !== duelIndex) return d;
        return {
          ...d,
          challenges: d.challenges.map((c) => {
            if (c.type !== cType) return c;
            return { ...c, [side]: value };
          }),
        };
      }),
    );
  };

  const validateBeforeSubmit = () => {
    for (let i = 0; i < duels.length; i++) {
      const d = duels[i];

      if (!d.playerA || !d.playerB) {
        toast.error(`En duelo ${i + 1}, tenés que elegir jugador A y B`);
        return false;
      }
      if (d.playerA === d.playerB) {
        toast.error(`En duelo ${i + 1}, A y B no pueden ser el mismo jugador`);
        return false;
      }

      if (status === "played") {
        for (const c of d.challenges) {
          if (c.scoreA === "" || c.scoreB === "") {
            toast.error(
              `En duelo ${i + 1} (${c.type}), si está played tenés que cargar scoreA y scoreB`,
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    const payloadDuels = duels.map((d) => ({
      playerA: d.playerA,
      playerB: d.playerB,
      challenges: d.challenges.map((c) => ({
        type: c.type,
        // scheduled => mandamos null para que el back lo deje en null
        scoreA: status === "played" ? Number(c.scoreA) : null,
        scoreB: status === "played" ? Number(c.scoreB) : null,
      })),
    }));

    mutation.mutate({
      matchdayId: id,
      status,
      duels: payloadDuels,
    });
  };

  if (isLoadingMatchday) return <p>Cargando editor FULL...</p>;
  if (isErrorMatchday) return <p>❌ Error: {errorMatchday?.message}</p>;

  return (
    <div className="prode-page">
      <div className="prode-form-head">
        <h2 className="prode-title">Editor FULL</h2>

        <Link className="back-btn" to="/admin/prode/fechas">
          <i className="fa-solid fa-arrow-left"></i> Volver
        </Link>
      </div>

      {isLoadingPlayers && <p>Cargando jugadores...</p>}
      {isErrorPlayers && <p>❌ Error: {errorPlayers?.message}</p>}

      {!isLoadingPlayers && !isErrorPlayers && (
        <form className="prode-form" onSubmit={handleSubmit}>
          <label>Estado de la fecha</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="scheduled">scheduled</option>
            <option value="played">played</option>
          </select>

          <p className="prode-help">
            Si está <strong>scheduled</strong>, podés cargar fixture sin scores.
            Si está <strong>played</strong>, cargás scores y el backend calcula
            resultados/puntos.
          </p>

          {duels.map((d, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "8px",
                padding: "0.8rem",
                marginTop: "0.6rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <strong>Duel {idx + 1}</strong>

                <button
                  type="button"
                  className="prode-secondary-btn"
                  onClick={() => removeDuel(idx)}
                  disabled={duels.length === 1}
                >
                  Quitar
                </button>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label>Player A</label>
                  <select
                    value={d.playerA}
                    onChange={(e) =>
                      setDuelField(idx, "playerA", e.target.value)
                    }
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {playersOptions.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label>Player B</label>
                  <select
                    value={d.playerB}
                    onChange={(e) =>
                      setDuelField(idx, "playerB", e.target.value)
                    }
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {playersOptions.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={{ marginTop: "0.6rem" }}>Challenges</label>

              <div
                className="prode-table-wrapper"
                style={{ marginTop: "0.4rem" }}
              >
                <table className="prode-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Score A</th>
                      <th>Score B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHALLENGE_TYPES.map((t) => {
                      const c = d.challenges.find((x) => x.type === t);
                      return (
                        <tr key={t}>
                          <td>{t}</td>
                          <td>
                            <input
                              type="number"
                              value={c?.scoreA ?? ""}
                              disabled={status !== "played"}
                              onChange={(e) =>
                                setChallengeScore(
                                  idx,
                                  t,
                                  "scoreA",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={c?.scoreB ?? ""}
                              disabled={status !== "played"}
                              onChange={(e) =>
                                setChallengeScore(
                                  idx,
                                  t,
                                  "scoreB",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="prode-secondary-btn"
            onClick={addDuel}
            style={{ marginTop: "0.8rem" }}
          >
            + Agregar duelo
          </button>

          <button
            type="submit"
            className="prode-submit-btn"
            disabled={mutation.isPending}
            style={{ marginTop: "0.8rem" }}
          >
            {mutation.isPending ? "Guardando..." : "Guardar FULL"}
          </button>
        </form>
      )}
    </div>
  );
};

export default UpdateProdeMatchdayFull;
