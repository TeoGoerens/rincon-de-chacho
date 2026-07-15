// Import React dependencies
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./ProdeGdtStyles.css";

//Import components
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchMyGdtSquad from "../../reactquery/prode/fetchMyGdtSquad";
import fetchGdtUniversePlayers from "../../reactquery/prode/fetchGdtUniversePlayers";
import fetchGdtRevealedSquads from "../../reactquery/prode/fetchGdtRevealedSquads";
import saveMyGdtSquad from "../../reactquery/prode/saveMyGdtSquad";
import saveMyGdtReplacements from "../../reactquery/prode/saveMyGdtReplacements";
import saveMyGdtWindowChanges from "../../reactquery/prode/saveMyGdtWindowChanges";
import { getUserId } from "../../reactquery/getUserInformation";

const REVEALED_STATUSES = ["revealed", "resolving", "final"];

/* Formación FIJA 1-4-4-2 (espejo del backend): índice = slot - 1 */
const SLOT_LAYOUT = [
  "ARQ",
  "DEF",
  "DEF",
  "DEF",
  "DEF",
  "VOL",
  "VOL",
  "VOL",
  "VOL",
  "DEL",
  "DEL",
];

const POSITION_BLOCKS = [
  { position: "ARQ", title: "Arquero", slots: [1] },
  { position: "DEF", title: "Defensores", slots: [2, 3, 4, 5] },
  { position: "VOL", title: "Volantes", slots: [6, 7, 8, 9] },
  { position: "DEL", title: "Delanteros", slots: [10, 11] },
];

const formatDeadline = (isoDate) => {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  const day = d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const time = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} · ${time}`;
};

const emptySlots = () => Array(11).fill(null);

const slotsFromSquad = (squad) => {
  const slots = emptySlots();
  (squad?.slots ?? []).forEach((slot) => {
    if (slot.slotNumber >= 1 && slot.slotNumber <= 11) {
      slots[slot.slotNumber - 1] = String(
        slot.realPlayer?._id ?? slot.realPlayer,
      );
    }
  });
  return slots;
};

const draftStorageKey = (userId, universeId) =>
  `prodeGdtDraft:${userId}:${universeId}`;

const ProdeGdtDraft = () => {
  const { universeId } = useParams();
  const queryClient = useQueryClient();
  const userId = getUserId();

  const [slots, setSlots] = useState(emptySlots());
  const [savedSlots, setSavedSlots] = useState(emptySlots());
  const [hydrated, setHydrated] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [search, setSearch] = useState("");

  const {
    data: myData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["gdt-my-squad", universeId, userId],
    queryFn: () => fetchMyGdtSquad(universeId),
    retry: false,
  });

  const universe = myData?.universe;
  const isRevealed = REVEALED_STATUSES.includes(universe?.draftStatus);

  /* Post-revelación la pantalla cambia de armador a vista de planteles */
  const { data: revealedData, isLoading: revealedLoading } = useQuery({
    queryKey: ["gdt-revealed-squads", universeId, userId],
    queryFn: () => fetchGdtRevealedSquads(universeId),
    enabled: Boolean(universe) && isRevealed,
  });

  /* El pool se necesita para armar (draft abierto), para reemplazos de la
     ronda del draft y para los cambios de la ventana mensual */
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ["gdt-universe-players", universeId],
    queryFn: () => fetchGdtUniversePlayers(universeId),
    enabled:
      Boolean(universe) &&
      (!isRevealed ||
        revealedData?.roundOpen === true ||
        Boolean(revealedData?.window)),
  });

  /* Reemplazos elegidos en la ronda (estado local, hidratado UNA vez del
     server — un refetch por re-foco no pisa la elección en curso) */
  const [replacements, setReplacements] = useState({});
  const [replHydrated, setReplHydrated] = useState(false);
  useEffect(() => {
    if (!revealedData || replHydrated) return;
    const initial = {};
    for (const staged of revealedData.myStaged ?? []) {
      initial[staged.slotNumber] = String(
        staged.realPlayer?._id ?? staged.realPlayer,
      );
    }
    setReplacements(initial);
    setReplHydrated(true);
  }, [revealedData, replHydrated]);

  /* Solo elegibles: con posición asignada */
  const pool = useMemo(
    () => (poolData ?? []).filter((p) => p.position),
    [poolData],
  );
  const poolById = useMemo(
    () => new Map(pool.map((p) => [String(p._id), p])),
    [pool],
  );

  /* El deadline es solo la fecha objetivo comunicada: la carga se cierra
     recién con la revelación (canEdit = draft en estado "open") */
  const editable = Boolean(myData?.canEdit);

  /* Hidratación: plantel del server + borrador local si difiere (local
     gana: es lo último que el participante tocó y no llegó a guardar) */
  useEffect(() => {
    if (!myData || hydrated) return;
    const serverSlots = slotsFromSquad(myData.squad);
    setSavedSlots(serverSlots);

    let next = serverSlots;
    try {
      const raw = localStorage.getItem(draftStorageKey(userId, universeId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed?.slots) &&
          parsed.slots.length === 11 &&
          JSON.stringify(parsed.slots) !== JSON.stringify(serverSlots) &&
          myData.canEdit
        ) {
          next = parsed.slots;
          setRestoredDraft(true);
        }
      }
    } catch {
      /* borrador ilegible: se ignora */
    }
    setSlots(next);
    setHydrated(true);
  }, [myData, hydrated, userId, universeId]);

  const dirty = JSON.stringify(slots) !== JSON.stringify(savedSlots);

  /* Borrador local silencioso + aviso nativo al cerrar con cambios */
  useEffect(() => {
    if (!hydrated) return;
    if (dirty) {
      localStorage.setItem(
        draftStorageKey(userId, universeId),
        JSON.stringify({ slots, savedAt: Date.now() }),
      );
    } else {
      localStorage.removeItem(draftStorageKey(userId, universeId));
    }
  }, [slots, dirty, hydrated, userId, universeId]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const saveMutation = useMutation({
    mutationFn: saveMyGdtSquad,
    onSuccess: (squad) => {
      const serverSlots = slotsFromSquad(squad);
      setSavedSlots(serverSlots);
      setSlots(serverSlots);
      setRestoredDraft(false);
      localStorage.removeItem(draftStorageKey(userId, universeId));
      queryClient.invalidateQueries(["gdt-my-squad", universeId, userId]);
      toast.success(
        serverSlots.filter(Boolean).length === 11
          ? "Plantel completo guardado"
          : "Plantel guardado (incompleto)",
      );
    },
    onError: (err) => {
      toast.error(err?.message || "Error al guardar tu plantel");
    },
  });

  const filledCount = slots.filter(Boolean).length;

  /* Clubes ya usados por OTROS slots (regla 1 por club) */
  const clubBySlot = slots.map((playerId) =>
    playerId ? poolById.get(playerId)?.club : null,
  );

  /* Correcciones del admin sobre el pool (posición mal asignada, o una
     transferencia de club en el mercado de pases) pueden invalidar
     elecciones ya guardadas: se detectan acá y se marcan slot por slot.
     SOLO mientras el draft es editable — con el plantel ya aprobado, un
     conflicto sobreviniente se maneja con el bloqueo puntual del admin
     (regla del dueño), no pidiendo una corrección imposible. */
  const slotIssues = slots.map((playerId, index) => {
    if (!editable) return null;
    if (!playerId) return null;
    const player = poolById.get(playerId);
    if (!player) return null;
    if (player.position !== SLOT_LAYOUT[index]) {
      return "Cambió de posición: ya no puede ocupar este slot";
    }
    const duplicatedClub = slots.some(
      (otherId, otherIndex) =>
        otherIndex !== index &&
        otherId &&
        poolById.get(otherId)?.club === player.club,
    );
    if (duplicatedClub) {
      return `Tenés dos jugadores de ${player.club}: dejá solo uno`;
    }
    return null;
  });
  const issueCount = slotIssues.filter(Boolean).length;
  const validCount = filledCount - issueCount;

  const setSlotPlayer = (slotNumber, playerId) => {
    setSlots((prev) =>
      prev.map((value, index) =>
        index === slotNumber - 1 ? playerId : value,
      ),
    );
    setActiveSlot(null);
    setSearch("");
  };

  const openPicker = (slotNumber) => {
    setActiveSlot((prev) => (prev === slotNumber ? null : slotNumber));
    setSearch("");
  };

  const handleSave = () => {
    const payload = slots
      .map((playerId, index) =>
        playerId ? { slotNumber: index + 1, realPlayer: playerId } : null,
      )
      .filter(Boolean);
    saveMutation.mutate({ universeId, slots: payload });
  };

  const discardDraft = () => {
    setSlots(savedSlots);
    setRestoredDraft(false);
    localStorage.removeItem(draftStorageKey(userId, universeId));
  };

  const setReplacement = (slotNumber, playerId) => {
    setReplacements((prev) => {
      const next = { ...prev };
      if (playerId) next[slotNumber] = playerId;
      else delete next[slotNumber];
      return next;
    });
    setActiveSlot(null);
    setSearch("");
  };

  const replaceMutation = useMutation({
    mutationFn: saveMyGdtReplacements,
    onSuccess: (staged) => {
      const next = {};
      for (const item of staged ?? []) {
        next[item.slotNumber] = String(item.realPlayer?._id ?? item.realPlayer);
      }
      setReplacements(next);
      queryClient.invalidateQueries(["gdt-revealed-squads", universeId, userId]);
      toast.success("Reemplazos guardados: se aplican cuando cierre la ronda");
    },
    onError: (err) => {
      toast.error(err?.message || "Error al guardar tus reemplazos");
    },
  });

  const handleSaveReplacements = () => {
    const picks = Object.entries(replacements).map(
      ([slotNumber, realPlayer]) => ({
        slotNumber: Number(slotNumber),
        realPlayer,
      }),
    );
    replaceMutation.mutate({ universeId, picks });
  };

  /* ── Ventana de cambios mensual: estado local hidratado UNA vez ── */
  const [windowChanges, setWindowChanges] = useState({});
  const [windowNoChanges, setWindowNoChanges] = useState(false);
  const [windowHydrated, setWindowHydrated] = useState(false);
  useEffect(() => {
    const info = revealedData?.window;
    if (!info || windowHydrated) return;
    const initial = {};
    for (const item of info.myStaged ?? []) {
      initial[item.slotNumber] = String(
        item.realPlayer?._id ?? item.realPlayer,
      );
    }
    setWindowChanges(initial);
    setWindowNoChanges(Boolean(info.myNoChanges));
    setWindowHydrated(true);
  }, [revealedData, windowHydrated]);

  const setWindowChange = (slotNumber, playerId) => {
    setWindowChanges((prev) => {
      const next = { ...prev };
      if (playerId) next[slotNumber] = playerId;
      else delete next[slotNumber];
      return next;
    });
    if (playerId) setWindowNoChanges(false);
    setActiveSlot(null);
    setSearch("");
  };

  const windowMutation = useMutation({
    mutationFn: saveMyGdtWindowChanges,
    onSuccess: (data) => {
      /* Reapertura o corrección: el guardado consume y aplica directo */
      const oneShotApplied =
        data?.reopenedApplied ?? data?.correctionApplied;
      if (oneShotApplied !== undefined) {
        const label =
          data?.correctionApplied !== undefined
            ? "Corrección"
            : "Reapertura";
        setWindowChanges({});
        queryClient.invalidateQueries([
          "gdt-revealed-squads",
          universeId,
          userId,
        ]);
        toast.success(
          oneShotApplied === 0
            ? `${label} cerrada sin cambios`
            : `${label} cerrada: ${oneShotApplied} ${oneShotApplied === 1 ? "cambio aplicado" : "cambios aplicados"}`,
        );
        return;
      }
      const next = {};
      for (const item of data?.staged ?? []) {
        next[item.slotNumber] = String(item.realPlayer?._id ?? item.realPlayer);
      }
      setWindowChanges(next);
      setWindowNoChanges(Boolean(data?.noChanges));
      queryClient.invalidateQueries(["gdt-revealed-squads", universeId, userId]);
      toast.success(
        data?.noChanges
          ? "Confirmaste que no hacés cambios este mes"
          : "Cambios guardados: se aplican cuando el admin cierre la ventana",
      );
    },
    onError: (err) => {
      toast.error(err?.message || "Error al guardar tus cambios");
    },
  });

  const handleSaveWindowChanges = () => {
    const changes = Object.entries(windowChanges).map(
      ([slotNumber, realPlayer]) => ({
        slotNumber: Number(slotNumber),
        realPlayer,
      }),
    );
    windowMutation.mutate({ universeId, changes, noChanges: false });
  };

  const handleConfirmNoChanges = () => {
    windowMutation.mutate({ universeId, changes: [], noChanges: true });
  };

  if (isLoading) return <SpinnerOverlay />;

  if (isError) {
    return (
      <div className="prg-wrap">
        <div className="prg-state">
          <p>
            {error?.status === 403
              ? error.message
              : error?.message || "Ocurrió un error al cargar el draft."}
          </p>
          <Link className="prg-back" to="/prode">
            Volver al Prode
          </Link>
        </div>
      </div>
    );
  }

  const pickerCandidates =
    activeSlot !== null
      ? pool
          .filter((p) => p.position === SLOT_LAYOUT[activeSlot - 1])
          .filter((p) => {
            const term = search.trim().toLowerCase();
            return (
              !term ||
              p.name.toLowerCase().includes(term) ||
              p.club.toLowerCase().includes(term)
            );
          })
      : [];

  const renderAvatar = (player) =>
    player?.photoUrl ? (
      <img className="prg-photo" src={player.photoUrl} alt="" loading="lazy" />
    ) : (
      <span className="prg-photo prg-photo--initial">
        {(player?.name ?? "?").charAt(0)}
      </span>
    );

  /* ── Vista post-revelación: todos los planteles, quemados marcados;
       con ronda abierta, los slots quemados propios eligen reemplazo ── */
  if (isRevealed) {
    if (
      revealedLoading ||
      !revealedData ||
      ((revealedData.roundOpen || revealedData.window) && poolLoading)
    )
      return <SpinnerOverlay />;

    const burnedSet = new Set(revealedData.burned);
    const isFinal = universe?.draftStatus === "final";
    const roundOpen = Boolean(revealedData.roundOpen);

    /* Ventana de cambios mensual (solo con draft final) */
    const windowInfo = revealedData.window ?? null;
    const windowOpenPhase = windowInfo?.status === "open";
    const windowRoundPhase = windowInfo?.status === "resolving";
    const windowReopenedPhase = windowInfo?.status === "reopened";
    const windowCorrectionPhase = windowInfo?.status === "correction";
    const myAllowance = windowInfo?.myAllowance ?? 0;
    const myRetrySet = new Set(windowInfo?.myRetrySlots ?? []);
    const myCorrectionSet = new Set(windowInfo?.myCorrectableSlots ?? []);
    const canWindowEdit =
      windowOpenPhase ||
      windowReopenedPhase ||
      windowCorrectionPhase ||
      (windowRoundPhase && myRetrySet.size > 0);
    const windowMaxChanges = windowReopenedPhase
      ? myAllowance
      : windowCorrectionPhase
        ? myCorrectionSet.size
        : 2;
    const windowChangesCount = Object.keys(windowChanges).length;

    const windowStagedFromServer = {};
    for (const item of windowInfo?.myStaged ?? []) {
      windowStagedFromServer[item.slotNumber] = String(
        item.realPlayer?._id ?? item.realPlayer,
      );
    }
    const windowDirty =
      canWindowEdit &&
      (JSON.stringify(windowChanges) !==
        JSON.stringify(windowStagedFromServer) ||
        windowNoChanges !== Boolean(windowInfo?.myNoChanges));

    const mySquad = revealedData.squads.find(
      (squad) =>
        String(squad.player?._id ?? squad.player) === revealedData.myPlayerId,
    );
    const myPendingCount = (mySquad?.slots ?? []).filter((slot) =>
      burnedSet.has(String(slot.realPlayer?._id ?? slot.realPlayer)),
    ).length;
    const canReplace = roundOpen && myPendingCount > 0;

    /* Exclusividad total post-revelación: nadie que ya esté en un plantel */
    const takenIds = new Set();
    for (const squad of revealedData.squads) {
      for (const slot of squad.slots ?? []) {
        takenIds.add(String(slot.realPlayer?._id ?? slot.realPlayer));
      }
    }

    const stagedFromServer = {};
    for (const item of revealedData.myStaged ?? []) {
      stagedFromServer[item.slotNumber] = String(
        item.realPlayer?._id ?? item.realPlayer,
      );
    }
    const replDirty =
      JSON.stringify(replacements) !== JSON.stringify(stagedFromServer);
    const chosenCount = Object.keys(replacements).length;

    /* Elecciones en curso: de la ronda del draft o de la ventana (nunca
       conviven en el tiempo) */
    const currentPicks = canReplace ? replacements : windowChanges;
    const setCurrentPick = canReplace ? setReplacement : setWindowChange;

    /* Clubes del plantel resultante propio (con las elecciones aplicadas),
       para la regla 1-por-club en el picker */
    const myResultingClubBySlot = new Map(
      (mySquad?.slots ?? []).map((slot) => {
        const pickedId = currentPicks[slot.slotNumber];
        const club = pickedId
          ? poolById.get(pickedId)?.club
          : slot.realPlayer?.club;
        return [slot.slotNumber, club];
      }),
    );

    const replacementDisabledReason = (slot, candidate) => {
      const candidateId = String(candidate._id);
      if (takenIds.has(candidateId)) return "Ya está en un plantel";
      const chosenElsewhere = Object.entries(currentPicks).some(
        ([slotNumber, playerId]) =>
          Number(slotNumber) !== slot.slotNumber && playerId === candidateId,
      );
      if (chosenElsewhere) return "Ya lo elegiste";
      const clubClash = [...myResultingClubBySlot].some(
        ([slotNumber, club]) =>
          slotNumber !== slot.slotNumber && club === candidate.club,
      );
      if (clubClash) return `Ya tenés un jugador de ${candidate.club}`;
      return null;
    };

    const renderSquadCard = (squad) => {
      const ownerId = String(squad.player?._id ?? squad.player);
      const isMine = ownerId === revealedData.myPlayerId;
      const burnedCount = (squad.slots ?? []).filter((slot) =>
        burnedSet.has(String(slot.realPlayer?._id ?? slot.realPlayer)),
      ).length;

      return (
        <section
          className={`prg-rev-card${isMine ? " prg-rev-card--mine" : ""}`}
          key={ownerId}
        >
          <header className="prg-rev-head">
            <span className="prg-rev-owner">
              {squad.player?.name}
              {isMine && <span className="prg-rev-you"> (vos)</span>}
            </span>
            {burnedCount > 0 && (
              <span className="prg-rev-pending">
                {burnedCount} por reemplazar
              </span>
            )}
          </header>
          <div className="prg-rev-slots">
            {(squad.slots ?? []).map((slot) => {
              const player = slot.realPlayer;
              const burned = burnedSet.has(String(player?._id ?? player));
              const draftEditThis = isMine && canReplace && burned;
              const windowEditThis =
                isMine &&
                canWindowEdit &&
                (windowOpenPhase ||
                  windowReopenedPhase ||
                  (windowCorrectionPhase &&
                    myCorrectionSet.has(slot.slotNumber)) ||
                  myRetrySet.has(slot.slotNumber));
              const editingThis = draftEditThis || windowEditThis;
              const chosenId = editingThis
                ? currentPicks[slot.slotNumber]
                : null;
              const chosen = chosenId ? poolById.get(chosenId) : null;
              const pickerOpen =
                editingThis && activeSlot === slot.slotNumber;

              return (
                <React.Fragment key={slot.slotNumber}>
                  <div
                    className={`prg-rev-slot${burned ? " prg-rev-slot--burned" : ""}${slot.blocked ? " prg-rev-slot--blocked" : ""}`}
                  >
                    <span className="prg-slot-number">
                      {slot.slotNumber}
                    </span>
                    <span className="prg-rev-pos">{slot.position}</span>
                    {renderAvatar(player)}
                    <span className="prg-slot-player">
                      <span className="prg-slot-name">{player?.name}</span>
                      <span className="prg-slot-club">{player?.club}</span>
                    </span>
                    {burned && (
                      <span className="prg-rev-burned-tag">Quemado</span>
                    )}
                    {slot.blocked && (
                      <span
                        className="prg-rev-burned-tag"
                        title="Bloqueado por el admin (conflicto sobrevenido): suma 0 hasta que se resuelva"
                      >
                        Bloqueado
                      </span>
                    )}
                    {/* Ventana abierta o reapertura: acción para cambiar */}
                    {isMine &&
                      (windowOpenPhase || windowReopenedPhase) &&
                      !chosenId && (
                        <span className="prg-slot-actions">
                          <button
                            type="button"
                            className="prg-slot-btn"
                            disabled={windowChangesCount >= windowMaxChanges}
                            title={
                              windowChangesCount >= windowMaxChanges
                                ? windowReopenedPhase
                                  ? "No te quedan cambios del mes"
                                  : "Máximo 2 cambios por ventana"
                                : undefined
                            }
                            onClick={() => openPicker(slot.slotNumber)}
                          >
                            Cambiar
                          </button>
                        </span>
                      )}
                  </div>

                  {editingThis &&
                    (chosen ||
                      draftEditThis ||
                      windowRoundPhase ||
                      windowCorrectionPhase) && (
                      <div className="prg-rev-replace">
                        {chosen ? (
                          <>
                            <span className="prg-rev-replace-label">
                              {windowOpenPhase || windowReopenedPhase
                                ? "Entra:"
                                : "Reemplazo:"}
                            </span>
                            {renderAvatar(chosen)}
                            <span className="prg-slot-player">
                              <span className="prg-slot-name">
                                {chosen.name}
                              </span>
                              <span className="prg-slot-club">
                                {chosen.club}
                              </span>
                            </span>
                            <span className="prg-slot-actions">
                              <button
                                type="button"
                                className="prg-slot-btn"
                                onClick={() => openPicker(slot.slotNumber)}
                              >
                                Cambiar
                              </button>
                              <button
                                type="button"
                                className="prg-slot-btn prg-slot-btn--remove"
                                onClick={() =>
                                  setCurrentPick(slot.slotNumber, null)
                                }
                              >
                                Quitar
                              </button>
                            </span>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="prg-slot-empty"
                            onClick={() => openPicker(slot.slotNumber)}
                          >
                            {windowRoundPhase && !canReplace
                              ? "Re-elegir (si no, conservás tu jugador anterior)"
                              : "Elegir reemplazo"}
                          </button>
                        )}
                      </div>
                    )}

                  {pickerOpen && (
                    <div className="prg-picker">
                      <input
                        className="prg-picker-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o club..."
                        autoFocus
                      />
                      <div className="prg-picker-list">
                        {pool
                          .filter(
                            (candidate) =>
                              candidate.position === slot.position &&
                              !burnedSet.has(String(candidate._id)),
                          )
                          .filter((candidate) => {
                            const term = search.trim().toLowerCase();
                            return (
                              !term ||
                              candidate.name.toLowerCase().includes(term) ||
                              candidate.club.toLowerCase().includes(term)
                            );
                          })
                          .map((candidate) => {
                            const reason = replacementDisabledReason(
                              slot,
                              candidate,
                            );
                            return (
                              <button
                                type="button"
                                className="prg-picker-row"
                                key={String(candidate._id)}
                                disabled={Boolean(reason)}
                                onClick={() =>
                                  setCurrentPick(
                                    slot.slotNumber,
                                    String(candidate._id),
                                  )
                                }
                              >
                                {renderAvatar(candidate)}
                                <span className="prg-picker-info">
                                  <span className="prg-picker-name">
                                    {candidate.name}
                                  </span>
                                  <span className="prg-picker-club">
                                    {reason ?? candidate.club}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>
      );
    };

    return (
      <div className="prg-wrap">
        {(replaceMutation.isPending || windowMutation.isPending) && (
          <SpinnerOverlay />
        )}

        <div className="prg-header">
          <p className="prg-eyebrow">Prode · Gran DT</p>
          <h1 className="prg-title">{universe?.label}</h1>
          <p className="prg-subtitle">
            {universe?.league} · {universe?.tournament?.name}{" "}
            {universe?.tournament?.year}
          </p>
        </div>

        {windowCorrectionPhase ? (
          <div className="prg-banner prg-banner--teal">
            El admin te habilitó una corrección por un error de datos del
            pool: reponé{" "}
            {myCorrectionSet.size === 1
              ? "el slot marcado"
              : `los ${myCorrectionSet.size} slots marcados`}
            . No gasta tus cambios mensuales, y al guardar la corrección se
            consume.
          </div>
        ) : windowReopenedPhase ? (
          <div className="prg-banner prg-banner--teal">
            El admin te reabrió los cambios de {windowInfo.month}:{" "}
            {myAllowance === 1
              ? "te queda 1 cambio"
              : `te quedan ${myAllowance} cambios`}{" "}
            del mes. Elegís viendo los planteles de todos, y al guardar la
            reapertura se consume — incluso si no cambiás nada.
          </div>
        ) : windowOpenPhase ? (
          <div className="prg-banner prg-banner--teal">
            Ventana de cambios de {windowInfo.month} abierta: podés hacer
            hasta 2 cambios, a ciegas, con fecha objetivo{" "}
            {formatDeadline(windowInfo.deadline)}. Si no vas a cambiar nada,
            confirmalo abajo así el admin puede cerrar antes.
          </div>
        ) : windowRoundPhase && myRetrySet.size > 0 ? (
          <div className="prg-banner prg-banner--teal">
            Tu cambio se quemó (lo eligieron 4 o más): re-elegí a ciegas en
            esta ronda, o no hagas nada y conservás tu jugador anterior.
          </div>
        ) : windowRoundPhase ? (
          <div className="prg-banner prg-banner--yellow">
            Ronda de la ventana de {windowInfo.month} en curso: los
            afectados por quemas están re-eligiendo.
          </div>
        ) : isFinal ? (
          <div className="prg-banner prg-banner--teal">
            Draft cerrado: estos son los planteles definitivos del universo.
          </div>
        ) : canReplace ? (
          <div className="prg-banner prg-banner--teal">
            Ronda de reemplazos abierta: elegí quién entra por cada quemado.
            Tu elección es a ciegas — nadie la ve hasta que el admin cierre
            la ronda — y si 4 o más eligen al mismo jugador, se quema
            también.
          </div>
        ) : roundOpen ? (
          <div className="prg-banner prg-banner--yellow">
            Ronda de reemplazos en curso: los afectados están eligiendo. Tu
            plantel no tiene nada pendiente.
          </div>
        ) : (
          <div className="prg-banner prg-banner--yellow">
            Planteles revelados. Los jugadores marcados como quemados
            estaban en 4 o más equipos y deben reemplazarse: el admin va a
            abrir las rondas de reemplazo.
          </div>
        )}

        <div className="prg-rev-grid">
          {revealedData.squads.map(renderSquadCard)}
        </div>

        {canReplace && (
          <div className="prg-save-bar">
            <span className="prg-save-status">
              <span
                className={`prg-save-dot${replDirty ? " prg-save-dot--dirty" : ""}`}
              />
              {replDirty
                ? "Cambios sin guardar"
                : chosenCount === myPendingCount
                  ? "Reemplazos completos guardados"
                  : `Elegiste ${chosenCount} de ${myPendingCount}`}
            </span>
            <button
              type="button"
              className="prg-save-btn"
              onClick={handleSaveReplacements}
              disabled={replaceMutation.isPending || !replDirty}
            >
              {replaceMutation.isPending
                ? "Guardando..."
                : "Guardar reemplazos"}
            </button>
          </div>
        )}

        {canWindowEdit && (
          <div className="prg-save-bar">
            <span className="prg-save-status">
              <span
                className={`prg-save-dot${windowDirty ? " prg-save-dot--dirty" : ""}`}
              />
              {windowCorrectionPhase
                ? `Correcciones: ${windowChangesCount} de ${myCorrectionSet.size} — guardar consume la corrección`
                : windowReopenedPhase
                ? `Cambios elegidos: ${windowChangesCount} de ${myAllowance} — guardar consume la reapertura`
                : windowDirty
                  ? "Cambios sin guardar"
                  : windowNoChanges
                    ? "Confirmaste: sin cambios este mes"
                    : windowOpenPhase
                      ? `Cambios: ${windowChangesCount} de 2`
                      : `Re-elegiste ${windowChangesCount} de ${myRetrySet.size}`}
            </span>
            <span className="prg-save-actions">
              {windowOpenPhase && (
                <button
                  type="button"
                  className="prg-discard"
                  onClick={handleConfirmNoChanges}
                  disabled={windowMutation.isPending || windowNoChanges}
                >
                  Confirmar sin cambios
                </button>
              )}
              <button
                type="button"
                className="prg-save-btn"
                onClick={handleSaveWindowChanges}
                disabled={
                  windowMutation.isPending ||
                  (!windowDirty &&
                    !windowReopenedPhase &&
                    !windowCorrectionPhase)
                }
              >
                {windowMutation.isPending
                  ? "Guardando..."
                  : windowCorrectionPhase
                    ? "Guardar corrección"
                    : windowReopenedPhase
                      ? "Guardar y cerrar reapertura"
                      : windowOpenPhase
                        ? "Guardar cambios"
                        : "Guardar re-elección"}
              </button>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="prg-wrap">
      {saveMutation.isPending && <SpinnerOverlay />}

      <div className="prg-header">
        <p className="prg-eyebrow">Prode · Gran DT</p>
        <h1 className="prg-title">{universe?.label}</h1>
        <p className="prg-subtitle">
          {universe?.league} · {universe?.tournament?.name}{" "}
          {universe?.tournament?.year}
        </p>
      </div>

      {editable ? (
        <div className="prg-banner prg-banner--teal">
          Armado a ciegas: nadie ve tu equipo hasta la revelación. Fecha
          objetivo: {formatDeadline(universe?.draftDeadline)} — podés editar
          hasta que el admin revele los planteles.
        </div>
      ) : (
        <div className="prg-banner prg-banner--yellow">
          {universe?.draftStatus === "setup"
            ? "El draft de este universo todavía no fue abierto."
            : "El armado está cerrado."}
        </div>
      )}

      {restoredDraft && editable && (
        <div className="prg-banner prg-banner--teal prg-banner--row">
          <span>Recuperamos un plantel que no habías guardado.</span>
          <button type="button" className="prg-discard" onClick={discardDraft}>
            Descartar
          </button>
        </div>
      )}

      {issueCount > 0 && editable && (
        <div className="prg-banner prg-banner--yellow">
          {issueCount === 1
            ? "El admin corrigió el pool de jugadores y una de tus elecciones quedó inválida: revisá el slot marcado."
            : `El admin corrigió el pool de jugadores y ${issueCount} de tus elecciones quedaron inválidas: revisá los slots marcados.`}
        </div>
      )}

      <div className="prg-progress">
        <div className="prg-progress-track">
          <div
            className="prg-progress-fill"
            style={{ width: `${(validCount / 11) * 100}%` }}
          />
        </div>
        <span
          className={`prg-progress-text${validCount === 11 ? " prg-progress-text--done" : ""}`}
        >
          {validCount} de 11
        </span>
      </div>

      {poolLoading ? (
        <p className="prg-state">Cargando el pool de jugadores...</p>
      ) : (
        POSITION_BLOCKS.map((block) => (
          <section className="prg-block" key={block.position}>
            <h2 className="prg-block-title">{block.title}</h2>
            <div className="prg-slot-list">
              {block.slots.map((slotNumber) => {
                const playerId = slots[slotNumber - 1];
                const player = playerId ? poolById.get(playerId) : null;
                const issue = slotIssues[slotNumber - 1];
                const pickerOpen = activeSlot === slotNumber;

                return (
                  <div className="prg-slot" key={slotNumber}>
                    <div
                      className={`prg-slot-row${player ? " prg-slot-row--filled" : ""}${issue ? " prg-slot-row--warn" : ""}`}
                    >
                      <span className="prg-slot-number">{slotNumber}</span>

                      {player ? (
                        <>
                          {renderAvatar(player)}
                          <span className="prg-slot-player">
                            <span className="prg-slot-name">
                              {player.name}
                            </span>
                            <span className="prg-slot-club">
                              {player.club}
                            </span>
                            {issue && (
                              <span className="prg-slot-warn">{issue}</span>
                            )}
                          </span>
                          {editable && (
                            <span className="prg-slot-actions">
                              <button
                                type="button"
                                className="prg-slot-btn"
                                onClick={() => openPicker(slotNumber)}
                              >
                                Cambiar
                              </button>
                              <button
                                type="button"
                                className="prg-slot-btn prg-slot-btn--remove"
                                onClick={() => setSlotPlayer(slotNumber, null)}
                              >
                                Quitar
                              </button>
                            </span>
                          )}
                        </>
                      ) : editable ? (
                        <button
                          type="button"
                          className="prg-slot-empty"
                          onClick={() => openPicker(slotNumber)}
                        >
                          Elegir jugador
                        </button>
                      ) : (
                        <span className="prg-slot-vacant">Sin elegir</span>
                      )}
                    </div>

                    {pickerOpen && editable && (
                      <div className="prg-picker">
                        <input
                          className="prg-picker-search"
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar por nombre o club..."
                          autoFocus
                        />
                        <div className="prg-picker-list">
                          {pickerCandidates.length === 0 && (
                            <p className="prg-picker-empty">
                              No hay jugadores que coincidan.
                            </p>
                          )}
                          {pickerCandidates.map((candidate) => {
                            const candidateId = String(candidate._id);
                            const usedInSlot = slots.findIndex(
                              (id, index) =>
                                id === candidateId &&
                                index !== slotNumber - 1,
                            );
                            const clubClashSlot = clubBySlot.findIndex(
                              (club, index) =>
                                club === candidate.club &&
                                index !== slotNumber - 1,
                            );
                            const disabledReason =
                              usedInSlot !== -1
                                ? "Ya está en tu equipo"
                                : clubClashSlot !== -1
                                  ? `Ya tenés un jugador de ${candidate.club}`
                                  : null;

                            return (
                              <button
                                type="button"
                                className="prg-picker-row"
                                key={candidateId}
                                disabled={Boolean(disabledReason)}
                                onClick={() =>
                                  setSlotPlayer(slotNumber, candidateId)
                                }
                              >
                                {renderAvatar(candidate)}
                                <span className="prg-picker-info">
                                  <span className="prg-picker-name">
                                    {candidate.name}
                                  </span>
                                  <span className="prg-picker-club">
                                    {disabledReason ?? candidate.club}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editable && (
        <div className="prg-save-bar">
          <span className="prg-save-status">
            <span
              className={`prg-save-dot${dirty || issueCount > 0 ? " prg-save-dot--dirty" : ""}`}
            />
            {issueCount > 0
              ? "Corregí los slots marcados para poder guardar"
              : dirty
                ? "Cambios sin guardar"
                : validCount === 11
                  ? "Plantel completo guardado"
                  : "Guardado"}
          </span>
          <button
            type="button"
            className="prg-save-btn"
            onClick={handleSave}
            disabled={saveMutation.isPending || !dirty || issueCount > 0}
          >
            {saveMutation.isPending ? "Guardando..." : "Guardar plantel"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProdeGdtDraft;
