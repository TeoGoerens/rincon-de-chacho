import mongoose from "mongoose";

/* Vínculo MANUAL equipo TheSportsDB → equipo API-Football, elegido por el
   admin en el modal de equipos del pool cuando la resolución automática no
   pudo decidir. Es POR LIGA (no por universo): una vez vinculado, el club
   queda resuelto para todos los universos futuros de esa liga. Complementa
   a API_FOOTBALL_TEAM_ALIASES de la config (que sigue vigente). */
const gdtTeamLinkSchema = new mongoose.Schema(
  {
    /* Liga TheSportsDB (= leagueProviderId del universo) */
    leagueProviderId: { type: String, required: true, trim: true },
    /* ID del equipo en TheSportsDB: estable ante correcciones de nombre */
    sourceTeamId: { type: String, required: true, trim: true },
    /* Nombre TheSportsDB al momento de vincular — solo referencia visual */
    sourceTeamName: { type: String, required: true, trim: true },
    /* ID del equipo en API-Football */
    providerTeamId: { type: String, required: true, trim: true },
    /* Nombre API-Football al momento de vincular — solo referencia visual */
    providerTeamName: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

gdtTeamLinkSchema.index(
  { leagueProviderId: 1, sourceTeamId: 1 },
  { unique: true },
);

const GdtTeamLink = mongoose.model("GdtTeamLink", gdtTeamLinkSchema);
export default GdtTeamLink;
