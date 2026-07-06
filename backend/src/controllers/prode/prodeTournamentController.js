import ProdeTournamentRepository from "../../repository/prode/prodeTournamentRepository.js";
import { PRODE_MONTHS } from "../../dao/models/prode/prodeConstants.js";

const repository = new ProdeTournamentRepository();

const validateMonths = (months) => {
  if (!Array.isArray(months) || months.length === 0) {
    throw new Error("El torneo debe tener al menos un mes");
  }
  const invalid = months.filter((m) => !PRODE_MONTHS.includes(m));
  if (invalid.length > 0) {
    throw new Error(`Meses inválidos: ${invalid.join(", ")}`);
  }
};

export default class ProdeTournamentController {
  /* --------------- CREATE PRODE TOURNAMENT --------------- */
  createProdeTournament = async (req, res, next) => {
    try {
      const { name, year, months, participants } = req.body;
      if (!name || !name.trim()) {
        throw new Error("El nombre del torneo es obligatorio");
      }
      if (!year || Number.isNaN(Number(year))) {
        throw new Error("El año del torneo es obligatorio");
      }
      validateMonths(months);

      const tournamentCreated = await repository.createProdeTournament({
        name,
        year: Number(year),
        months,
        participants,
      });
      res.status(201).json({
        message: "Prode tournament created successfully",
        tournamentCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL PRODE TOURNAMENTS --------------- */
  getAllProdeTournaments = async (req, res, next) => {
    try {
      const tournaments = await repository.getAllProdeTournaments();
      res.status(200).json({
        message: "All Prode tournaments retrieved successfully",
        tournaments,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PRODE TOURNAMENT BY ID --------------- */
  getProdeTournamentById = async (req, res, next) => {
    try {
      const tournament = await repository.getProdeTournamentById(
        req.params.id,
      );
      res.status(200).json({
        message: "Prode tournament retrieved successfully",
        tournament,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PRODE TOURNAMENT --------------- */
  updateProdeTournament = async (req, res, next) => {
    try {
      const { name, year, months, status, participants } = req.body;
      if (months !== undefined) validateMonths(months);

      const tournamentUpdated = await repository.updateProdeTournament(
        req.params.id,
        { name, year, months, status, participants },
      );
      res.status(200).json({
        message: "Prode tournament updated successfully",
        tournamentUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PRODE TOURNAMENT --------------- */
  deleteProdeTournament = async (req, res, next) => {
    try {
      await repository.deleteProdeTournament(req.params.id);
      res
        .status(200)
        .json({ message: "Prode tournament deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
