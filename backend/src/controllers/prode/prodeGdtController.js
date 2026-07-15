import GdtUniverseRepository from "../../repository/prode/gdtUniverseRepository.js";
import GdtRealPlayerRepository from "../../repository/prode/gdtRealPlayerRepository.js";
import GdtSquadRepository from "../../repository/prode/gdtSquadRepository.js";

const teamRepository = new GdtUniverseRepository();
const realPlayerRepository = new GdtRealPlayerRepository();
const squadRepository = new GdtSquadRepository();

export default class ProdeGdtController {
  /* ============ UNIVERSOS GDT ============ */

  /* --------------- CREATE GDT TEAM --------------- */
  createGdtUniverse = async (req, res, next) => {
    try {
      const { tournament, label, leagueProviderId, isPrimary } = req.body;
      if (!tournament) throw new Error("El torneo es obligatorio");
      if (!leagueProviderId) throw new Error("La liga es obligatoria");

      const teamCreated = await teamRepository.createGdtUniverse({
        tournament,
        label,
        leagueProviderId,
        isPrimary,
      });
      res.status(201).json({
        message: "GDT team created successfully",
        teamCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET GDT TEAMS BY TOURNAMENT --------------- */
  getGdtUniversesByTournament = async (req, res, next) => {
    try {
      const teams = await teamRepository.getGdtUniversesByTournament(
        req.params.tournamentId,
      );
      res.status(200).json({
        message: "GDT teams retrieved successfully",
        teams,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET GDT TEAM BY ID --------------- */
  getGdtUniverseById = async (req, res, next) => {
    try {
      const team = await teamRepository.getGdtUniverseById(req.params.id);
      res.status(200).json({
        message: "GDT team retrieved successfully",
        team,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE GDT TEAM --------------- */
  updateGdtUniverse = async (req, res, next) => {
    try {
      const { label } = req.body;
      const teamUpdated = await teamRepository.updateGdtUniverse(req.params.id, {
        label,
      });
      res.status(200).json({
        message: "GDT team updated successfully",
        teamUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE GDT TEAM --------------- */
  deleteGdtUniverse = async (req, res, next) => {
    try {
      await teamRepository.deleteGdtUniverse(req.params.id);
      res.status(200).json({ message: "GDT team deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  /* ============ POOL DE JUGADORES DEL UNIVERSO ============ */

  /* --------------- GET TEAM POOL --------------- */
  getGdtUniversePlayers = async (req, res, next) => {
    try {
      const players = await realPlayerRepository.getPlayersByTeam(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT team pool retrieved successfully",
        players,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET REAL PLAYER BY ID --------------- */
  getGdtRealPlayerById = async (req, res, next) => {
    try {
      const player = await realPlayerRepository.getGdtRealPlayerById(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT real player retrieved successfully",
        player,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CREATE REAL PLAYER --------------- */
  createGdtRealPlayer = async (req, res, next) => {
    try {
      const { name, club, position } = req.body;
      const playerCreated = await realPlayerRepository.createGdtRealPlayer(
        req.params.id,
        { name, club, position },
      );
      res.status(201).json({
        message: "GDT real player created successfully",
        playerCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE REAL PLAYER --------------- */
  updateGdtRealPlayer = async (req, res, next) => {
    try {
      const { name, club, position } = req.body;
      const { playerUpdated, impacts, unblockSuggestions } =
        await realPlayerRepository.updateGdtRealPlayer(req.params.id, {
          name,
          club,
          position,
        });
      res.status(200).json({
        message: "GDT real player updated successfully",
        playerUpdated,
        impacts,
        unblockSuggestions,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE REAL PLAYER --------------- */
  deleteGdtRealPlayer = async (req, res, next) => {
    try {
      await realPlayerRepository.deleteGdtRealPlayer(req.params.id);
      res.status(200).json({
        message: "GDT real player deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /* ============ DRAFT A CIEGAS ============ */

  /* --------------- OPEN GDT DRAFT (admin) --------------- */
  openGdtDraft = async (req, res, next) => {
    try {
      const { draftDeadline } = req.body;
      const result = await teamRepository.openGdtDraft(
        req.params.id,
        draftDeadline,
      );
      res.status(200).json({
        message: "GDT draft opened successfully",
        universe: result.universe,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE GDT DRAFT DEADLINE (admin) --------------- */
  updateGdtDraftDeadline = async (req, res, next) => {
    try {
      const { draftDeadline } = req.body;
      const universe = await teamRepository.updateGdtDraftDeadline(
        req.params.id,
        draftDeadline,
      );
      res.status(200).json({
        message: "GDT draft deadline updated successfully",
        universe,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- REVEAL GDT DRAFT (admin) --------------- */
  revealGdtDraft = async (req, res, next) => {
    try {
      const result = await teamRepository.revealGdtDraft(req.params.id);
      res.status(200).json({
        message: "GDT draft revealed successfully",
        universe: result.universe,
        burnedCount: result.burnedCount,
        affected: result.affected,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET REVEALED SQUADS (participante) --------------- */
  getRevealedGdtSquads = async (req, res, next) => {
    try {
      const result = await squadRepository.getRevealedSquads(
        req.params.id,
        req.prodePlayerId,
      );
      res.status(200).json({
        message: "GDT squads retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- OPEN REPLACEMENT ROUND (admin) --------------- */
  openGdtReplacementRound = async (req, res, next) => {
    try {
      const result = await teamRepository.openGdtReplacementRound(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT replacement round opened successfully",
        universe: result.universe,
        affectedCount: result.affectedCount,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CLOSE REPLACEMENT ROUND (admin) --------------- */
  closeGdtReplacementRound = async (req, res, next) => {
    try {
      const result = await teamRepository.closeGdtReplacementRound(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT replacement round closed successfully",
        universe: result.universe,
        applied: result.applied,
        newBurnedPlayers: result.newBurnedPlayers,
        stillPendingTotal: result.stillPendingTotal,
        discardedByClub: result.discardedByClub,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- FINALIZE GDT DRAFT (admin) --------------- */
  finalizeGdtDraft = async (req, res, next) => {
    try {
      const universe = await teamRepository.finalizeGdtDraft(req.params.id);
      res.status(200).json({
        message: "GDT draft finalized successfully",
        universe,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- STAGE MY REPLACEMENTS (participante) --------------- */
  stageMyGdtReplacements = async (req, res, next) => {
    try {
      const staged = await squadRepository.stageMyReplacements(
        req.params.id,
        req.prodePlayerId,
        req.body.picks,
      );
      res.status(200).json({
        message: "GDT replacements staged successfully",
        staged,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- OPEN CHANGE WINDOW (admin) --------------- */
  openGdtChangeWindow = async (req, res, next) => {
    try {
      const { month, deadline } = req.body;
      const result = await teamRepository.openGdtChangeWindow(req.params.id, {
        month,
        deadline,
      });
      res.status(200).json({
        message: "GDT change window opened successfully",
        universe: result.universe,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CLOSE CHANGE WINDOW (admin) --------------- */
  closeGdtChangeWindow = async (req, res, next) => {
    try {
      const result = await teamRepository.closeGdtChangeWindow(req.params.id);
      res.status(200).json({
        message: "GDT change window closed successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET CHANGE WINDOW OVERVIEW (admin) --------------- */
  getGdtWindowOverview = async (req, res, next) => {
    try {
      const overview = await teamRepository.getGdtWindowOverview(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT change window overview retrieved successfully",
        overview,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ADMIN SQUADS (admin) --------------- */
  getGdtAdminSquads = async (req, res, next) => {
    try {
      const result = await squadRepository.getAdminSquads(req.params.id);
      res.status(200).json({
        message: "GDT admin squads retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SET SLOT BLOCK (admin) --------------- */
  setGdtSlotBlock = async (req, res, next) => {
    try {
      const { slotNumber, blocked } = req.body;
      const squad = await squadRepository.setSlotBlock(
        req.params.id,
        req.params.playerId,
        slotNumber,
        blocked,
      );
      res.status(200).json({
        message: "GDT slot block updated successfully",
        squad,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GRANT CORRECTION (admin) --------------- */
  grantGdtCorrection = async (req, res, next) => {
    try {
      const result = await teamRepository.grantGdtCorrection(
        req.params.id,
        req.body.playerId,
      );
      res.status(200).json({
        message: "GDT correction granted successfully",
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- REOPEN WINDOW FOR (admin) --------------- */
  reopenGdtWindowFor = async (req, res, next) => {
    try {
      const result = await teamRepository.reopenGdtWindowFor(
        req.params.id,
        req.body.playerId,
      );
      res.status(200).json({
        message: "GDT window reopened successfully",
        month: result.month,
        failedEmails: result.failedEmails,
        participantsWithoutUser: result.participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- STAGE MY WINDOW CHANGES (participante) --------------- */
  stageMyGdtWindowChanges = async (req, res, next) => {
    try {
      const { changes, noChanges } = req.body;
      const result = await squadRepository.stageMyWindowChanges(
        req.params.id,
        req.prodePlayerId,
        { changes, noChanges },
      );
      res.status(200).json({
        message: "GDT window changes staged successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET GDT DRAFT OVERVIEW (admin) --------------- */
  getGdtDraftOverview = async (req, res, next) => {
    try {
      const overview = await teamRepository.getGdtDraftOverview(req.params.id);
      res.status(200).json({
        message: "GDT draft overview retrieved successfully",
        overview,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MY GDT SQUAD (participante) --------------- */
  getMyGdtSquad = async (req, res, next) => {
    try {
      const result = await squadRepository.getMyDraftSquad(
        req.params.id,
        req.prodePlayerId,
      );
      res.status(200).json({
        message: "GDT squad retrieved successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPSERT MY GDT SQUAD (participante) --------------- */
  upsertMyGdtSquad = async (req, res, next) => {
    try {
      const squad = await squadRepository.upsertMyDraftSquad(
        req.params.id,
        req.prodePlayerId,
        req.body.slots,
      );
      res.status(200).json({
        message: "GDT squad saved successfully",
        squad,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- IMPORT TEAM POOL --------------- */
  importGdtUniversePool = async (req, res, next) => {
    try {
      const summary = await realPlayerRepository.importPoolFromProvider(
        req.params.id,
      );
      res.status(200).json({
        message: "GDT team pool imported successfully",
        summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
