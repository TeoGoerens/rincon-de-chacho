// Import React dependencies
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";
import "../ProdeFormStyles.css";
import {
  GDT_DRAFT_STATUS,
  GDT_POSITION_LABELS,
  GDT_POSITION_OPTIONS,
  toDatetimeLocalValue,
  formatDeadline,
} from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import SuperDeleteButton from "../../../Layout/Buttons/SuperDeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

//Import React Query functions
import fetchGdtUniverseById from "../../../../reactquery/prode/fetchGdtUniverseById";
import fetchGdtUniversePlayers from "../../../../reactquery/prode/fetchGdtUniversePlayers";
import importGdtUniversePool from "../../../../reactquery/prode/importGdtUniversePool";
import deleteGdtRealPlayer from "../../../../reactquery/prode/deleteGdtRealPlayer";
import superDeleteProdeEntity from "../../../../reactquery/prode/superDeleteProdeEntity";
import fetchGdtDraftOverview from "../../../../reactquery/prode/fetchGdtDraftOverview";
import openGdtDraft from "../../../../reactquery/prode/openGdtDraft";
import updateGdtDraftDeadline from "../../../../reactquery/prode/updateGdtDraftDeadline";
import revealGdtDraft from "../../../../reactquery/prode/revealGdtDraft";
import openGdtReplacementRound from "../../../../reactquery/prode/openGdtReplacementRound";
import closeGdtReplacementRound from "../../../../reactquery/prode/closeGdtReplacementRound";
import finalizeGdtDraft from "../../../../reactquery/prode/finalizeGdtDraft";
import fetchGdtWindowOverview from "../../../../reactquery/prode/fetchGdtWindowOverview";
import openGdtChangeWindow from "../../../../reactquery/prode/openGdtChangeWindow";
import closeGdtChangeWindow from "../../../../reactquery/prode/closeGdtChangeWindow";
import fetchGdtAdminSquads from "../../../../reactquery/prode/fetchGdtAdminSquads";
import setGdtSlotBlock from "../../../../reactquery/prode/setGdtSlotBlock";
import reopenGdtWindow from "../../../../reactquery/prode/reopenGdtWindow";
import grantGdtCorrection from "../../../../reactquery/prode/grantGdtCorrection";

//Import components (compartidos del admin Prode)
import InfoTip from "../InfoTip";

const GDT_PLAYER_SUPER_DELETE_WARNING =
  "Borra al jugador del pool aunque esté en planteles: sus slots quedan vacíos (suman 0 en los mini-duelos), y se lo quita de los reemplazos pendientes, de los quemados y de los puntajes de fecha cargados.";

/* Slots inconsistentes de un plantel (posición ≠ slot o club duplicado):
   el alcance de la "corrección" que el admin puede habilitar */
const countInconsistentSlots = (squad) => {
  const normClub = (club) => (club ?? "").trim().toLowerCase();
  const marked = new Set();
  const slotsByClub = new Map();
  for (const slot of squad?.slots ?? []) {
    const player = slot.realPlayer;
    if (player?.position && player.position !== slot.position) {
      marked.add(slot.slotNumber);
    }
    const clubKey = normClub(player?.club);
    if (!clubKey) continue;
    if (!slotsByClub.has(clubKey)) slotsByClub.set(clubKey, []);
    slotsByClub.get(clubKey).push(slot.slotNumber);
  }
  for (const slotNumbers of slotsByClub.values()) {
    if (slotNumbers.length > 1) {
      slotNumbers.forEach((slotNumber) => marked.add(slotNumber));
    }
  }
  return marked.size;
};

/* Detalle de un universo GDT: datos + su pool de jugadores con la carga
   inicial desde la API, filtros y curaduría manual. */
const GdtUniverseDetail = () => {
  const { universeId } = useParams();
  const queryClient = useQueryClient();

  const [clubFilter, setClubFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [poolPage, setPoolPage] = useState(1);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [draftDeadlineInput, setDraftDeadlineInput] = useState("");
  const [confirmOpenDraftVisible, setConfirmOpenDraftVisible] = useState(false);
  const [confirmRevealVisible, setConfirmRevealVisible] = useState(false);
  /* "round-open" | "round-close" | "finalize" | "window-open" |
     "window-close" | null */
  const [confirmRoundAction, setConfirmRoundAction] = useState(null);
  const [windowMonth, setWindowMonth] = useState("");
  const [windowDeadlineInput, setWindowDeadlineInput] = useState("");
  const [reopenPlayerId, setReopenPlayerId] = useState("");

  const {
    data: team,
    isLoading: isLoadingTeam,
    isError: isErrorTeam,
    error: errorTeam,
  } = useQuery({
    queryKey: ["gdt-universe", universeId],
    queryFn: () => fetchGdtUniverseById(universeId),
  });

  const { data: playersData, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ["gdt-universe-players", universeId],
    queryFn: () => fetchGdtUniversePlayers(universeId),
  });

  /* Estado del draft: quiénes entregaron plantel completo (sin contenido —
     el armado es a ciegas también para esta vista). Con el universo
     DEFINITIVO deja de consultarse: evaluaría contra la versión base del
     draft, que ya no es la vigente. */
  const { data: draftOverview } = useQuery({
    queryKey: ["gdt-draft-overview", universeId],
    queryFn: () => fetchGdtDraftOverview(universeId),
    enabled:
      Boolean(team) &&
      team.draftStatus !== "setup" &&
      team.draftStatus !== "final",
  });

  /* Ventana de cambios mensual: solo universo principal con draft final */
  const { data: windowOverview } = useQuery({
    queryKey: ["gdt-window-overview", universeId],
    queryFn: () => fetchGdtWindowOverview(universeId),
    enabled:
      Boolean(team) && team.isPrimary && team.draftStatus === "final",
  });
  const activeWindow = windowOverview?.window ?? null;

  /* Planteles vigentes (vista admin): donde vive el bloqueo puntual */
  const { data: adminSquads } = useQuery({
    queryKey: ["gdt-admin-squads", universeId],
    queryFn: () => fetchGdtAdminSquads(universeId),
    enabled: Boolean(team) && team.draftStatus === "final",
  });

  const blockMutation = useMutation({
    mutationFn: setGdtSlotBlock,
    onSuccess: (squad, variables) => {
      toast.success(
        variables.blocked
          ? "Jugador bloqueado: suma 0 hasta que lo desbloquees o lo cambien"
          : "Jugador desbloqueado: vuelve a sumar",
      );
      queryClient.invalidateQueries(["gdt-admin-squads", universeId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al actualizar el bloqueo");
    },
  });

  const correctionMutation = useMutation({
    mutationFn: grantGdtCorrection,
    onSuccess: (data) => {
      toast.success(
        "Corrección habilitada: el participante puede reponer sus slots inconsistentes",
      );
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participante sin usuario vinculado (no recibe mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      queryClient.invalidateQueries(["gdt-admin-squads", universeId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al habilitar la corrección");
    },
  });

  const reopenMutation = useMutation({
    mutationFn: reopenGdtWindow,
    onSuccess: (data) => {
      toast.success(
        `Cambios de ${data.month} reabiertos: mail enviado al participante`,
      );
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participante sin usuario vinculado (no recibe mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      setReopenPlayerId("");
      queryClient.invalidateQueries(["gdt-window-overview", universeId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al reabrir la ventana");
    },
  });

  const handleReopenClick = () => {
    if (!reopenPlayerId) {
      toast.error("Elegí el participante al que reabrirle los cambios");
      return;
    }
    reopenMutation.mutate({ universeId, playerId: reopenPlayerId });
  };

  useEffect(() => {
    if (team) {
      setDraftDeadlineInput(toDatetimeLocalValue(team.draftDeadline));
    }
  }, [team]);

  const invalidatePool = () => {
    queryClient.invalidateQueries(["gdt-universe-players", universeId]);
    queryClient.invalidateQueries(["gdt-universes"]);
  };

  const invalidateDraft = () => {
    queryClient.invalidateQueries(["gdt-universe", universeId]);
    queryClient.invalidateQueries(["gdt-universes"]);
    queryClient.invalidateQueries(["gdt-draft-overview", universeId]);
  };

  const openDraftMutation = useMutation({
    mutationFn: openGdtDraft,
    onSuccess: (data) => {
      toast.success("Draft abierto: mail enviado a los participantes");
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al abrir el draft");
    },
  });

  const deadlineMutation = useMutation({
    mutationFn: updateGdtDraftDeadline,
    onSuccess: () => {
      toast.success("Deadline del draft actualizado");
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al actualizar el deadline");
    },
  });

  const revealMutation = useMutation({
    mutationFn: revealGdtDraft,
    onSuccess: (data) => {
      if (data?.burnedCount === 0) {
        toast.success("Planteles revelados sin quemas: el draft quedó cerrado");
      } else {
        toast.success(
          `Planteles revelados: ${data.burnedCount} ${data.burnedCount === 1 ? "jugador quemado" : "jugadores quemados"}`,
        );
        if (data?.affected?.length > 0) {
          toast.info(
            `Con reemplazos pendientes: ${data.affected
              .map((item) => `${item.name} (${item.burnedCount})`)
              .join(", ")}`,
          );
        }
      }
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al revelar los planteles");
    },
  });

  const handleConfirmReveal = () => {
    setConfirmRevealVisible(false);
    revealMutation.mutate({ universeId });
  };

  const roundOpenMutation = useMutation({
    mutationFn: openGdtReplacementRound,
    onSuccess: (data) => {
      toast.success(
        `Ronda de reemplazos abierta: mail enviado a ${data.affectedCount} ${data.affectedCount === 1 ? "afectado" : "afectados"}`,
      );
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al abrir la ronda");
    },
  });

  const roundCloseMutation = useMutation({
    mutationFn: closeGdtReplacementRound,
    onSuccess: (data) => {
      toast.success(
        `Ronda cerrada: ${data.applied} ${data.applied === 1 ? "reemplazo aplicado" : "reemplazos aplicados"}`,
      );
      if (data?.newBurnedPlayers?.length > 0) {
        toast.warn(
          `Quemas nuevas (elegidos por 4+): ${data.newBurnedPlayers
            .map((player) => `${player.name} (${player.club})`)
            .join(", ")}`,
        );
      }
      if (data?.discardedByClub?.length > 0) {
        toast.warn(
          `Reemplazos descartados por conflicto de club: ${data.discardedByClub.join(" · ")}`,
        );
      }
      if (data?.stillPendingTotal > 0) {
        toast.info(
          `Quedan ${data.stillPendingTotal} reemplazos pendientes: abrí otra ronda`,
        );
      } else {
        toast.success("Sin pendientes: ya podés cerrar el draft");
      }
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al cerrar la ronda");
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: finalizeGdtDraft,
    onSuccess: () => {
      toast.success(
        "Draft cerrado: los planteles son definitivos y el universo ya puede asignarse a fechas",
      );
      invalidateDraft();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al cerrar el draft");
    },
  });

  /* Cerrar con elecciones faltantes es VÁLIDO (un colgado no puede tener
     el draft de rehén: sus slots siguen pendientes para otra ronda), pero
     tiene que ser una decisión consciente: el modal avisa con nombres */
  const unstagedNames = (draftOverview?.participants ?? [])
    .filter(
      (participant) =>
        participant.pendingSlots > 0 &&
        participant.stagedSlots < participant.pendingSlots,
    )
    .map((participant) => participant.name);

  const windowOpenMutation = useMutation({
    mutationFn: openGdtChangeWindow,
    onSuccess: (data) => {
      toast.success("Ventana de cambios abierta: mail a los participantes");
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      if (data?.participantsWithoutUser?.length > 0) {
        toast.warn(
          `Participantes sin usuario vinculado (no reciben mail): ${data.participantsWithoutUser.join(", ")}`,
        );
      }
      setWindowMonth("");
      setWindowDeadlineInput("");
      queryClient.invalidateQueries(["gdt-window-overview", universeId]);
      queryClient.invalidateQueries(["gdt-universe", universeId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al abrir la ventana");
    },
  });

  const windowCloseMutation = useMutation({
    mutationFn: closeGdtChangeWindow,
    onSuccess: (data) => {
      toast.success(
        `Cierre procesado: ${data.applied} ${data.applied === 1 ? "cambio aplicado" : "cambios aplicados"}`,
      );
      if (data?.newBurnedPlayers?.length > 0) {
        toast.warn(
          `Quemas nuevas (elegidos por 4+): ${data.newBurnedPlayers
            .map((player) => `${player.name} (${player.club})`)
            .join(", ")}`,
        );
      }
      if (data?.discardedByClub?.length > 0) {
        toast.warn(
          `Cambios descartados por conflicto de club: ${data.discardedByClub.join(" · ")}`,
        );
      }
      if (data?.window?.status === "resolving") {
        toast.info(
          `Quedan ${data.retryTotal} re-elecciones: la ronda de la ventana está abierta`,
        );
      } else {
        toast.success(
          `Ventana de ${data?.window?.month} cerrada: versiones del mes creadas`,
        );
      }
      if (data?.failedEmails?.length > 0) {
        toast.warn(
          `No se pudo enviar el mail a: ${data.failedEmails.join(", ")}`,
        );
      }
      queryClient.invalidateQueries(["gdt-window-overview", universeId]);
      queryClient.invalidateQueries(["gdt-universe", universeId]);
    },
    onError: (err) => {
      toast.error(err?.message || "Error al cerrar la ventana");
    },
  });

  const handleWindowOpenClick = () => {
    if (!windowMonth) {
      toast.error("Elegí el mes de la ventana");
      return;
    }
    if (!windowDeadlineInput) {
      toast.error("Fijá la fecha objetivo de la ventana");
      return;
    }
    if (new Date(windowDeadlineInput) <= new Date()) {
      toast.error("La fecha objetivo debe estar en el futuro");
      return;
    }
    setConfirmRoundAction("window-open");
  };

  /* Aviso dinámico del cierre de ventana: quiénes no respondieron nada */
  const windowSilentNames = (windowOverview?.participants ?? [])
    .filter((participant) =>
      activeWindow?.status === "open"
        ? participant.stagedCount === 0 && !participant.noChanges
        : participant.retryCount > 0 && participant.stagedCount === 0,
    )
    .map((participant) => participant.name);

  const ROUND_ACTIONS = {
    "round-open": {
      title: `¿Abrir una ronda de reemplazos en ${team?.label}?`,
      body: "Los afectados reciben un mail y eligen los reemplazos de sus quemados en simultáneo, sin verse entre sí. Vos cerrás la ronda cuando hayan elegido todos.",
      confirmLabel: "Abrir ronda",
      run: () => roundOpenMutation.mutate({ universeId }),
    },
    "round-close": {
      title: `¿Cerrar la ronda de reemplazos de ${team?.label}?`,
      body: `Se revelan las elecciones: un reemplazo elegido por 4 o más se quema (nueva) y esos slots quedan para otra ronda; el resto se aplica a los planteles.${
        unstagedNames.length > 0
          ? ` OJO: ${unstagedNames.join(", ")} todavía no ${unstagedNames.length === 1 ? "eligió todos sus reemplazos" : "eligieron todos sus reemplazos"} — si cerrás ahora, esos slots siguen pendientes y van a necesitar otra ronda.`
          : " Todos los afectados ya eligieron."
      }`,
      confirmLabel: "Cerrar ronda",
      run: () => roundCloseMutation.mutate({ universeId }),
    },
    finalize: {
      title: `¿Cerrar el draft de ${team?.label}?`,
      body: "Los planteles quedan definitivos para todo el torneo (los cambios llegan recién con las ventanas mensuales) y el universo pasa a ser asignable a fechas. Esta acción no tiene vuelta atrás.",
      confirmLabel: "Cerrar draft",
      run: () => finalizeMutation.mutate({ universeId }),
    },
    "window-open": {
      title: `¿Abrir la ventana de cambios de ${windowMonth || "…"}?`,
      body: `Los participantes reciben un mail y pueden hacer hasta 2 cambios a ciegas (o confirmar que no cambian nada) hasta la fecha objetivo ${formatDeadline(
        windowDeadlineInput
          ? new Date(windowDeadlineInput).toISOString()
          : null,
      )}. La fecha es comunicativa: la ventana se cierra cuando vos la cierres.`,
      confirmLabel: "Abrir ventana",
      run: () =>
        windowOpenMutation.mutate({
          universeId,
          month: windowMonth,
          deadline: new Date(windowDeadlineInput).toISOString(),
        }),
    },
    "window-close": {
      title:
        activeWindow?.status === "resolving"
          ? `¿Cerrar la ronda de la ventana de ${activeWindow?.month}?`
          : `¿Cerrar la ventana de cambios de ${activeWindow?.month}?`,
      body: `Se revelan las elecciones: un entrante elegido por 4 o más se quema para todo el torneo (esos cambios se descartan y sus dueños re-eligen en una ronda); el resto se aplica y se crean las versiones del mes para todos — copia idéntica para quien no cambió nada.${
        windowSilentNames.length > 0
          ? ` OJO: ${windowSilentNames.join(", ")} todavía no ${windowSilentNames.length === 1 ? "respondió" : "respondieron"} — sus planteles se replican tal cual.`
          : " Todos los participantes ya respondieron."
      }`,
      confirmLabel:
        activeWindow?.status === "resolving" ? "Cerrar ronda" : "Cerrar ventana",
      run: () => windowCloseMutation.mutate({ universeId }),
    },
  };

  const handleConfirmRoundAction = () => {
    const action = ROUND_ACTIONS[confirmRoundAction];
    setConfirmRoundAction(null);
    action?.run();
  };

  const validateDraftDeadline = () => {
    if (!draftDeadlineInput) {
      toast.error("Fijá el deadline del draft");
      return false;
    }
    if (new Date(draftDeadlineInput) <= new Date()) {
      toast.error("El deadline del draft debe estar en el futuro");
      return false;
    }
    return true;
  };

  const handleOpenDraftClick = () => {
    if (!validateDraftDeadline()) return;
    setConfirmOpenDraftVisible(true);
  };

  const handleConfirmOpenDraft = () => {
    setConfirmOpenDraftVisible(false);
    openDraftMutation.mutate({
      universeId,
      draftDeadline: new Date(draftDeadlineInput).toISOString(),
    });
  };

  const handleDeadlineUpdate = () => {
    if (!validateDraftDeadline()) return;
    deadlineMutation.mutate({
      universeId,
      draftDeadline: new Date(draftDeadlineInput).toISOString(),
    });
  };

  const importMutation = useMutation({
    mutationFn: importGdtUniversePool,
    onSuccess: (summary) => {
      toast.success(
        `Import de ${summary.league}: ${summary.created} jugadores nuevos (${summary.teams} equipos)`,
      );
      if (summary.alreadyExisting > 0) {
        toast.info(`${summary.alreadyExisting} ya estaban en el pool`);
      }
      if (summary.withoutPosition.length > 0) {
        toast.warn(
          `${summary.withoutPosition.length} importados sin posición — completalos usando el filtro "Sin posición"`,
        );
      }
      if (summary.failedTeams.length > 0) {
        toast.error(
          `No se pudo consultar el plantel de: ${summary.failedTeams.join(", ")}`,
        );
      }
      invalidatePool();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al importar los planteles");
    },
  });

  const superDeleteMutation = useMutation({
    mutationFn: (playerId) =>
      superDeleteProdeEntity({ kind: "gdtPlayer", id: playerId }),
    onSuccess: () => {
      toast.success("Super eliminación completada");
      invalidatePool();
    },
    onError: (error) => {
      toast.error(error?.message || "Error en la super eliminación");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGdtRealPlayer,
    onSuccess: () => {
      toast.success("Jugador eliminado del pool");
      invalidatePool();
    },
    onError: (err) => {
      toast.error(err?.message || "Error al eliminar el jugador");
    },
  });

  const players = useMemo(() => playersData ?? [], [playersData]);

  const clubs = useMemo(
    () => [...new Set(players.map((p) => p.club))].sort(),
    [players],
  );

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players.filter((p) => {
      const positionMatch =
        !positionFilter ||
        (positionFilter === "__none__"
          ? !p.position
          : p.position === positionFilter);
      return (
        (!clubFilter || p.club === clubFilter) &&
        positionMatch &&
        (!term || p.name.toLowerCase().includes(term))
      );
    });
  }, [players, clubFilter, positionFilter, search]);

  /* Paginación del pool: los filtros aplican sobre TODOS los jugadores;
     la página solo recorta lo visible */
  const POOL_PAGE_SIZE = 15;
  const poolTotalPages = Math.max(
    1,
    Math.ceil(filteredPlayers.length / POOL_PAGE_SIZE),
  );
  useEffect(() => {
    setPoolPage(1);
  }, [clubFilter, positionFilter, search]);
  useEffect(() => {
    if (poolPage > poolTotalPages) setPoolPage(poolTotalPages);
  }, [poolPage, poolTotalPages]);
  const pagedPlayers = filteredPlayers.slice(
    (poolPage - 1) * POOL_PAGE_SIZE,
    poolPage * POOL_PAGE_SIZE,
  );

  const handleConfirmImport = () => {
    setConfirmImportVisible(false);
    importMutation.mutate({ universeId });
  };

  const renderPlayerCell = (player) => (
    <span className="pri-cell-player">
      {player.photoUrl ? (
        <img
          className="pri-photo"
          src={player.photoUrl}
          alt=""
          loading="lazy"
        />
      ) : (
        <span className="pri-photo pri-photo--initial">
          {(player.name ?? "?").charAt(0)}
        </span>
      )}
      <span className="pri-cell-name">{player.name}</span>
    </span>
  );

  if (isLoadingTeam) return <SpinnerOverlay />;
  if (isErrorTeam) {
    return (
      <div className="pri">
        <p className="pri-state">
          {errorTeam?.message || "Ocurrió un error al cargar el universo GDT."}
        </p>
      </div>
    );
  }

  const draftStatus =
    GDT_DRAFT_STATUS[team.draftStatus] ?? GDT_DRAFT_STATUS.open;

  return (
    <div className="pri">
      {(importMutation.isPending ||
        openDraftMutation.isPending ||
        revealMutation.isPending ||
        roundOpenMutation.isPending ||
        roundCloseMutation.isPending ||
        finalizeMutation.isPending ||
        windowOpenMutation.isPending ||
        windowCloseMutation.isPending) && <SpinnerOverlay />}

      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            {team.tournament?.name} {team.tournament?.year} · {team.league}
          </div>
          <h1 className="pri-title">
            {team.label}{" "}
            <span
              className={`pri-badge ${
                team.isPrimary ? "pri-badge--active" : "pri-badge--inactive"
              }`}
            >
              {team.isPrimary ? "Principal" : "Suplente"}
            </span>{" "}
            <span className={`pri-badge ${draftStatus.badge}`}>
              {draftStatus.label}
            </span>
          </h1>
          <p className="pri-subtitle">
            {playersData
              ? `${players.length} jugadores en el pool`
              : "Cargando pool..."}
          </p>
        </div>
        <Link className="prf-back-link" to="/admin/prode/gdt">
          Volver
        </Link>
      </div>

      {/* ── Proceso en curso · draft (desaparece al quedar definitivo) ── */}
      {team.draftStatus !== "final" && (
        <div className="prf-form pri-draft-card prf-compact">
          <div className="prf-card-title">
            Proceso en curso · Draft a ciegas
            <InfoTip text="El armado es a ciegas: nadie ve nada hasta la revelación. Abrir el draft fija el deadline (comunicativo) y manda mail a los participantes." />
          </div>

        {team.draftStatus === "setup" && (
          <>
            <div className="prf-inline-row">
            <div className="prf-field">
              <label>
                Deadline del draft
                <InfoTip text="Fecha objetivo comunicada por mail: no bloquea el armado. El corte real es la revelación." />
              </label>
              <input
                type="datetime-local"
                value={draftDeadlineInput}
                onChange={(e) => setDraftDeadlineInput(e.target.value)}
              />
            </div>
              <button
                type="button"
                className="prf-submit-btn"
                onClick={handleOpenDraftClick}
                disabled={
                  openDraftMutation.isPending ||
                  isLoadingPlayers ||
                  players.length === 0
                }
                title={
                  !isLoadingPlayers && players.length === 0
                    ? "El pool está vacío: importá los planteles antes de abrir el draft"
                    : undefined
                }
              >
                {openDraftMutation.isPending ? "Abriendo..." : "Abrir draft"}
              </button>
            </div>
          </>
        )}

        {team.draftStatus === "open" && (
          <>
            <div className="prf-inline-row">
              <div className="prf-field">
                <label>
                  Deadline del draft (fecha comunicada)
                  <InfoTip text="Fecha objetivo comunicada: no bloquea nada. La carga se cierra recién cuando revelás los planteles." />
                </label>
                <input
                  type="datetime-local"
                  value={draftDeadlineInput}
                  onChange={(e) => setDraftDeadlineInput(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="prf-submit-btn"
                onClick={handleDeadlineUpdate}
                disabled={deadlineMutation.isPending}
              >
                {deadlineMutation.isPending ? "Guardando..." : "Actualizar"}
              </button>
            </div>

            <button
              type="button"
              className="prf-submit-btn"
              onClick={() => setConfirmRevealVisible(true)}
              disabled={
                revealMutation.isPending || !draftOverview?.allComplete
              }
              title={
                !draftOverview?.allComplete
                  ? "Se habilita cuando el 100% de los participantes tenga su plantel completo y sin conflictos"
                  : undefined
              }
            >
              Revelar planteles
            </button>
          </>
        )}

        {team.draftStatus === "revealed" &&
          draftOverview &&
          (draftOverview.pendingTotal > 0 ? (
            <button
              type="button"
              className="prf-submit-btn"
              onClick={() => setConfirmRoundAction("round-open")}
              disabled={roundOpenMutation.isPending}
            >
              Abrir ronda de reemplazos
            </button>
          ) : (
            <button
              type="button"
              className="prf-submit-btn"
              onClick={() => setConfirmRoundAction("finalize")}
              disabled={finalizeMutation.isPending}
            >
              Cerrar draft
            </button>
          ))}

        {team.draftStatus === "resolving" && (
          <button
            type="button"
            className="prf-submit-btn"
            onClick={() => setConfirmRoundAction("round-close")}
            disabled={roundCloseMutation.isPending}
          >
            Cerrar ronda de reemplazos
          </button>
        )}

        {team.draftStatus !== "setup" && draftOverview && (
          <div className="pri-draft-overview">
            <p className="pri-draft-count">
              {team.draftStatus === "open" ? (
                <>
                  Planteles completos: {draftOverview.completeCount} de{" "}
                  {draftOverview.totalCount}
                  {draftOverview.allComplete && " — listo para revelar"}
                </>
              ) : team.draftStatus === "resolving" ? (
                <>
                  Ronda de reemplazos en curso — pendientes:{" "}
                  {draftOverview.pendingTotal}. Cerrá la ronda cuando todos
                  hayan elegido.
                </>
              ) : draftOverview.pendingTotal > 0 ? (
                <>
                  Reemplazos pendientes: {draftOverview.pendingTotal} — abrí
                  una ronda para resolverlos.
                </>
              ) : (
                <>Planteles definitivos: sin reemplazos pendientes.</>
              )}
            </p>

            {draftOverview.burnedPlayers?.length > 0 && (
              <p className="pri-draft-burned">
                <span className="pri-draft-burned-title">
                  Quemados para todo el torneo (
                  {draftOverview.burnedPlayers.length}):
                </span>{" "}
                {draftOverview.burnedPlayers
                  .map((player) => `${player.name} (${player.club})`)
                  .join(" · ")}
              </p>
            )}

            <div className="pri-draft-list">
              {draftOverview.participants.map((participant) => (
                <div className="pri-draft-row" key={participant.playerId}>
                  <span className="pri-draft-name">{participant.name}</span>
                  <span
                    className={`pri-badge ${
                      team.draftStatus === "resolving" &&
                      participant.pendingSlots > 0
                        ? participant.stagedSlots >= participant.pendingSlots
                          ? "pri-badge--active"
                          : "pri-badge--inplay"
                        : participant.pendingSlots > 0
                          ? "pri-badge--alert"
                          : participant.needsFix
                            ? "pri-badge--alert"
                            : participant.complete
                              ? "pri-badge--active"
                              : participant.slotsCount > 0
                                ? "pri-badge--inplay"
                                : "pri-badge--draft"
                    }`}
                    title={
                      team.draftStatus === "resolving" &&
                      participant.pendingSlots > 0
                        ? "Reemplazos elegidos en la ronda en curso (sin ver el contenido)"
                        : participant.pendingSlots > 0
                          ? "Tiene jugadores quemados por reemplazar"
                          : participant.needsFix
                            ? "Una corrección del pool invalidó parte de su plantel: tiene que corregirlo"
                            : undefined
                    }
                  >
                    {team.draftStatus === "resolving" &&
                    participant.pendingSlots > 0
                      ? `Eligió ${participant.stagedSlots} de ${participant.pendingSlots}`
                      : participant.pendingSlots > 0
                        ? `${participant.pendingSlots} por reemplazar`
                        : participant.needsFix
                          ? "A corregir"
                          : participant.complete
                            ? "Completo"
                            : participant.slotsCount > 0
                              ? `${participant.slotsCount}/11`
                              : "Sin armar"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      )}

      {/* ── Proceso en curso · ventana de cambios (universo definitivo) ── */}
      {team.isPrimary && team.draftStatus === "final" && (
        <div className="prf-form pri-draft-card prf-compact">
          <div className="prf-card-title">
            Proceso en curso · Ventana de cambios
            <InfoTip text="Hasta 2 cambios por participante, a ciegas, con quemas si 4 o más eligen al mismo entrante. Al cerrar se crean los planteles del mes para todos." />
          </div>

          {!activeWindow ? (
            (windowOverview?.availableMonths?.length ?? 0) > 0 ? (
              <>
                <div className="prf-player-row">
                  <div className="prf-field">
                    <label>
                      Mes
                      <InfoTip text="El primer mes del torneo se juega con los planteles del draft; los meses con equipos ya definidos no se pueden pisar." />
                    </label>
                    <select
                      value={windowMonth}
                      onChange={(e) => setWindowMonth(e.target.value)}
                    >
                      <option value="">Elegí el mes</option>
                      {(windowOverview.monthOptions ?? []).map((option) => (
                        <option
                          key={option.month}
                          value={option.month}
                          disabled={!option.available}
                        >
                          {option.month}
                          {option.reason ? ` — ${option.reason}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="prf-field">
                    <label>
                      Fecha objetivo
                      <InfoTip text="Va en el mail y en las pantallas: no bloquea nada. La ventana se cierra cuando vos la cierres." />
                    </label>
                    <input
                      type="datetime-local"
                      value={windowDeadlineInput}
                      onChange={(e) => setWindowDeadlineInput(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="prf-submit-btn"
                  onClick={handleWindowOpenClick}
                  disabled={windowOpenMutation.isPending}
                >
                  Abrir ventana de cambios
                </button>
              </>
            ) : (
              <p className="prf-hint">
                No quedan meses del torneo sin ventana de cambios.
              </p>
            )
          ) : (
            <>
              <p className="pri-draft-count">
                {activeWindow.status === "open"
                  ? `Ventana de ${activeWindow.month} abierta · fecha objetivo ${formatDeadline(activeWindow.deadline)}`
                  : `Ronda de la ventana de ${activeWindow.month} en curso: los quemados re-eligen a ciegas.`}
              </p>
              <div className="pri-draft-list">
                {(windowOverview?.participants ?? []).map((participant) => (
                  <div className="pri-draft-row" key={participant.playerId}>
                    <span className="pri-draft-name">{participant.name}</span>
                    <span
                      className={`pri-badge ${
                        activeWindow.status === "open"
                          ? participant.noChanges
                            ? "pri-badge--active"
                            : participant.stagedCount > 0
                              ? "pri-badge--inplay"
                              : "pri-badge--draft"
                          : participant.retryCount === 0
                            ? "pri-badge--inactive"
                            : participant.stagedCount >= participant.retryCount
                              ? "pri-badge--active"
                              : "pri-badge--alert"
                      }`}
                    >
                      {activeWindow.status === "open"
                        ? participant.noChanges
                          ? "Confirmó sin cambios"
                          : participant.stagedCount > 0
                            ? `${participant.stagedCount} ${participant.stagedCount === 1 ? "cambio listo" : "cambios listos"}`
                            : "Sin respuesta"
                        : participant.retryCount === 0
                          ? "Sin pendientes"
                          : `Re-eligió ${participant.stagedCount} de ${participant.retryCount}`}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="prf-submit-btn"
                onClick={() => setConfirmRoundAction("window-close")}
                disabled={windowCloseMutation.isPending}
              >
                {activeWindow.status === "resolving"
                  ? "Cerrar ronda de la ventana"
                  : "Cerrar ventana de cambios"}
              </button>
            </>
          )}

          {!activeWindow && windowOverview?.reopen && (
            <>
              <div className="prf-field">
                <label>
                  Reabrir cambios de {windowOverview.reopen.month}{" "}
                  (excepción)
                  <InfoTip text="El reabierto elige viendo todo (ya sin ciego), dentro del tope de 2 cambios del mes; su guardado consume la reapertura." />
                </label>
                <select
                  value={reopenPlayerId}
                  onChange={(e) => setReopenPlayerId(e.target.value)}
                >
                  <option value="">Elegí el participante</option>
                  {(windowOverview.allParticipants ?? [])
                    .filter(
                      (participant) =>
                        !windowOverview.reopen.reopenedNames.includes(
                          participant.name,
                        ),
                    )
                    .map((participant) => (
                      <option
                        key={participant.playerId}
                        value={participant.playerId}
                      >
                        {participant.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                className="prf-submit-btn"
                onClick={handleReopenClick}
                disabled={reopenMutation.isPending}
              >
                Reabrir cambios
              </button>
              {windowOverview.reopen.reopenedNames.length > 0 && (
                <p className="prf-hint">
                  Con reapertura pendiente:{" "}
                  {windowOverview.reopen.reopenedNames.join(", ")}
                </p>
              )}
            </>
          )}

        </div>
      )}

      {/* ── Planteles vigentes + bloqueo puntual (draft final) ── */}
      {team.draftStatus === "final" && adminSquads && (
        <div className="prf-form pri-draft-card prf-compact">
          <div className="prf-card-title">
            Planteles vigentes
            <InfoTip text="El bloqueo puntual sanciona un conflicto sobrevenido (mercado de pases): el jugador bloqueado suma 0 en ese plantel hasta que lo desbloquees o su dueño lo cambie en una ventana." />
          </div>
          {(adminSquads.squads ?? []).map((squad) => {
            const ownerId = String(squad.player?._id ?? squad.player);
            const blockedCount = (squad.slots ?? []).filter(
              (slot) => slot.blocked,
            ).length;
            const inconsistentCount = countInconsistentSlots(squad);
            const correctionGranted = (
              adminSquads.correctionsFor ?? []
            ).includes(ownerId);
            return (
              <details className="pri-squad" key={ownerId}>
                <summary className="pri-squad-summary">
                  <span className="pri-draft-name">
                    {squad.player?.name}
                    <span className="pri-squad-version">
                      {squad.month
                        ? ` · versión ${squad.month}`
                        : " · versión del draft"}
                    </span>
                  </span>
                  <span className="pri-squad-badges">
                    {inconsistentCount > 0 && (
                      <span className="pri-badge pri-badge--draft">
                        {inconsistentCount}{" "}
                        {inconsistentCount === 1
                          ? "inconsistente"
                          : "inconsistentes"}
                      </span>
                    )}
                    {blockedCount > 0 && (
                      <span className="pri-badge pri-badge--alert">
                        {blockedCount}{" "}
                        {blockedCount === 1 ? "bloqueado" : "bloqueados"}
                      </span>
                    )}
                  </span>
                </summary>
                {(inconsistentCount > 0 || correctionGranted) && (
                  <div className="pri-squad-correction">
                    <span className="prf-hint">
                      {correctionGranted
                        ? "Corrección pendiente: puede reponer sus slots inconsistentes (una vez)."
                        : "Error de datos del pool: habilitale una corrección para reponer sin gastar cambios (transferencia real → usar Bloquear)."}
                    </span>
                    {!correctionGranted && (
                      <button
                        type="button"
                        className="pri-block-btn"
                        disabled={correctionMutation.isPending}
                        onClick={() =>
                          correctionMutation.mutate({
                            universeId,
                            playerId: ownerId,
                          })
                        }
                      >
                        Habilitar corrección
                      </button>
                    )}
                  </div>
                )}
                <div className="pri-squad-slots">
                  {(squad.slots ?? []).map((slot) => (
                    <div
                      className={`pri-squad-slot${[2, 6, 10].includes(slot.slotNumber) ? " pri-squad-slot--group" : ""}`}
                      key={slot.slotNumber}
                    >
                      <span className="pri-squad-pos">
                        {slot.slotNumber} · {slot.position}
                      </span>
                      <span className="pri-squad-player">
                        {slot.realPlayer?.name}{" "}
                        <span className="pri-squad-club">
                          ({slot.realPlayer?.club})
                        </span>
                      </span>
                      {slot.blocked && (
                        <span className="pri-badge pri-badge--alert">
                          Bloqueado
                        </span>
                      )}
                      <button
                        type="button"
                        className={`pri-block-btn${slot.blocked ? " pri-block-btn--active" : ""}`}
                        disabled={blockMutation.isPending}
                        onClick={() =>
                          blockMutation.mutate({
                            universeId,
                            playerId: ownerId,
                            slotNumber: slot.slotNumber,
                            blocked: !slot.blocked,
                          })
                        }
                      >
                        {slot.blocked ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}

          {(adminSquads.burnedPlayers?.length ?? 0) > 0 && (
            <div className="pri-draft-burned">
              <span className="pri-draft-burned-title">
                Quemados para todo el torneo (
                {adminSquads.burnedPlayers.length})
                <InfoTip text="Del draft y de las ventanas: no elegibles en ningún plantel del torneo." />
              </span>
              <div className="pri-burned-list">
                {adminSquads.burnedPlayers.map((player) => (
                  <span className="pri-burned-item" key={String(player._id)}>
                    {player.name} ({player.club})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Historial (colapsado): lo que ya pasó, sin ruido diario ── */}
      {team.isPrimary &&
        team.draftStatus === "final" &&
        (windowOverview?.pastWindows?.length ?? 0) > 0 && (
          <div className="prf-form pri-draft-card prf-compact">
            <div className="prf-card-title">Historial</div>
            {windowOverview.pastWindows.map((item) => (
              <details className="pri-squad" key={item.month}>
                <summary className="pri-squad-summary">
                  <span className="pri-draft-name">
                    Ventana de {item.month}
                  </span>
                </summary>
                <div className="pri-window-history">
                  {(item.changes ?? []).map((change) => (
                    <p className="pri-window-history-row" key={change.name}>
                      <span className="pri-window-history-month">
                        {change.name} ({change.changesCount}{" "}
                        {change.changesCount === 1 ? "cambio" : "cambios"})
                      </span>
                      {(change.moves?.length ?? 0) > 0 && (
                        <>
                          :{" "}
                          {change.moves
                            .map(
                              (move) =>
                                `Sale: ${move.out} (${move.outClub}) Entra: ${move.in} (${move.inClub})`,
                            )
                            .join(" / ")}
                        </>
                      )}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}

      {/* ── Import (carga inicial) / reimport ADITIVO (equipos que faltaron
           resolver, refuerzos del mercado — nunca pisa ni duplica) ── */}
      <div className="pri-import-bar">
        {!isLoadingPlayers && (
          <button
            type="button"
            className={`pri-import-btn${
              players.length > 0 ? " pri-import-btn--again" : ""
            }`}
            onClick={() => setConfirmImportVisible(true)}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending
              ? "Importando planteles..."
              : players.length === 0
                ? `Importar planteles de ${team.league}`
                : "Reimportar planteles (solo agrega faltantes)"}
          </button>
        )}
        <Link className="pri-create-btn" to="jugadores/crear">
          <i className="fa-solid fa-plus"></i>
          Agregar jugador
        </Link>
      </div>

      {isLoadingPlayers ? (
        <p className="pri-state">Cargando pool...</p>
      ) : players.length <= 0 ? (
        <p className="pri-state">
          El pool está vacío: importá los planteles de la liga para arrancar.
        </p>
      ) : (
        <>
          {/* ── Filtros ── */}
          <div className="pri-filter-row">
            <div className="pri-filter">
              <select
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
              >
                <option value="">Todos los clubes</option>
                {clubs.map((club) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>
            </div>
            <div className="pri-filter">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="">Todas las posiciones</option>
                {GDT_POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="__none__">Sin posición</option>
              </select>
            </div>
            <input
              className="pri-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
            />
            <span className="pri-filter-count">
              {filteredPlayers.length} de {players.length}
            </span>
          </div>

          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Club</th>
                  <th>Posición</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedPlayers.map((player) => (
                  <tr key={player._id}>
                    <td>{renderPlayerCell(player)}</td>
                    <td>{player.club}</td>
                    <td>{GDT_POSITION_LABELS[player.position] ?? "—"}</td>
                    <td>
                      <div className="pri-actions">
                        <EditButton to={`jugadores/editar/${player._id}`} />
                        <DeleteButton
                          onClick={deleteMutation.mutate}
                          id={{ playerId: player._id }}
                        />
                        <SuperDeleteButton
                          onClick={superDeleteMutation.mutate}
                          id={player._id}
                          warning={GDT_PLAYER_SUPER_DELETE_WARNING}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="pri-mobile-list">
            {pagedPlayers.map((player) => (
              <div className="pri-mobile-card" key={player._id}>
                <div className="pri-mobile-row-top">
                  {renderPlayerCell(player)}
                  <div className="pri-actions">
                    <EditButton to={`jugadores/editar/${player._id}`} />
                    <DeleteButton
                      onClick={deleteMutation.mutate}
                      id={{ playerId: player._id }}
                    />
                    <SuperDeleteButton
                      onClick={superDeleteMutation.mutate}
                      id={player._id}
                      warning={GDT_PLAYER_SUPER_DELETE_WARNING}
                    />
                  </div>
                </div>
                <div className="pri-mobile-row-bottom">
                  <span className="pri-mobile-meta">
                    {[
                      player.club,
                      GDT_POSITION_LABELS[player.position] ?? "—",
                    ].join(" · ")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {poolTotalPages > 1 && (
            <div className="pri-pagination">
              <button
                type="button"
                disabled={poolPage <= 1}
                onClick={() => setPoolPage((page) => page - 1)}
              >
                Anterior
              </button>
              <span className="pri-pagination-info">
                Página {poolPage} de {poolTotalPages}
              </span>
              <button
                type="button"
                disabled={poolPage >= poolTotalPages}
                onClick={() => setPoolPage((page) => page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Modal de confirmación de acciones de ronda / cierre ── */}
      {confirmRoundAction && ROUND_ACTIONS[confirmRoundAction] && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
            </div>
            <h4>{ROUND_ACTIONS[confirmRoundAction].title}</h4>
            <p>{ROUND_ACTIONS[confirmRoundAction].body}</p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmRoundAction(null)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmRoundAction}
              >
                {ROUND_ACTIONS[confirmRoundAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación de la revelación ── */}
      {confirmRevealVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h4>¿Revelar los planteles de {team.label}?</h4>
            <p>
              Se cierra la edición para todos y los planteles pasan a ser
              visibles entre los participantes. Todo jugador presente en 4 o
              más planteles se quema para el resto del torneo, y los
              afectados reciben un mail para elegir reemplazos. Esta acción
              no tiene vuelta atrás.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmRevealVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmReveal}
              >
                Revelar planteles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación de apertura del draft ── */}
      {confirmOpenDraftVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <h4>¿Abrir el draft de {team.label}?</h4>
            <p>
              Los participantes reciben un mail para armar su equipo de 11 a
              ciegas, con fecha objetivo el{" "}
              {formatDeadline(
                draftDeadlineInput
                  ? new Date(draftDeadlineInput).toISOString()
                  : null,
              )}
              . Esa fecha es solo comunicativa: la carga se cierra recién
              cuando reveles los planteles.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmOpenDraftVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmOpenDraft}
              >
                Abrir draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación del import ── */}
      {confirmImportVisible && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </div>
            <h4>
              {players.length === 0
                ? `¿Importar los planteles de ${team.league}?`
                : `¿Reimportar los planteles de ${team.league}?`}
            </h4>
            <p>
              {players.length === 0
                ? "Es la carga inicial del pool de este universo: se traen los planteles actuales de toda la liga. A partir de ahí el pool se cura a mano — ediciones, altas y bajas. Puede tardar varios minutos: no cierres esta pantalla."
                : "El reimport es aditivo: solo agrega lo que falta (equipos que no se habían podido resolver, refuerzos del mercado de pases). Nunca pisa tus ediciones ni duplica jugadores ya importados. Puede tardar varios minutos: no cierres esta pantalla."}
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmImportVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmImport}
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GdtUniverseDetail;
