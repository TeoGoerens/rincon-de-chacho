export const assertTournamentNotFinished = (tournament) => {
  if (tournament?.status === "finished") {
    return {
      ok: false,
      status: 403,
      message: "Torneo finalizado: no se pueden editar fechas.",
    };
  }
  return { ok: true };
};
