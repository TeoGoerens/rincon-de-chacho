import mongoose from "mongoose";

import PlayerRepository from "../../repository/chachos/playerRepository.js";
const repository = new PlayerRepository();

export default class PlayerController {
  // ---------- GET PLAYER BY ID ----------
  getPlayerById = async (req, res, next) => {
    try {
      const playerId = req.params.pid;
      const player = await repository.baseGetById(playerId);
      res.status(200).json({
        message: `Player with id ${playerId} has been properly retrieved`,
        player,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- GET ALL PLAYERS ----------
  getAllPlayers = async (req, res, next) => {
    try {
      const players = await repository.baseGetAll({ sortBy: "shirt" });
      res
        .status(200)
        .json({ message: "All players have been properly retrieved", players });
    } catch (error) {
      next(error);
    }
  };
  // ---------- CREATE PLAYER ----------
  createPlayer = async (req, res, next) => {
    try {
      const player = {
        shirt: req.body.shirt,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        field_position: req.body.field_position,
        bio: req.body.bio,
        interview: req.body.interview,
        role: req.body.role,
      };

      const playerLoaded = await repository.baseCreate(player, "shirt");

      res
        .status(200)
        .json({ message: "Player has been properly created", playerLoaded });
    } catch (error) {
      next(error);
    }
  };
  // ---------- UPDATE PLAYER ----------
  updatePlayerById = async (req, res, next) => {
    try {
      const playerId = req.params.pid;

      const newPlayerInfo = {
        shirt: req.body.shirt,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        field_position: req.body.field_position,
        bio: req.body.bio,
        interview: req.body.interview,
        role: req.body.role,
      };

      const playerUpdated = await repository.baseUpdateById(
        playerId,
        newPlayerInfo
      );
      res.status(200).json({
        message: `Player with id ${playerId} has been properly updated`,
        playerUpdated,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- DELETE PLAYER ----------
  deletePlayerById = async (req, res, next) => {
    try {
      const playerId = req.params.pid;
      const playerDeleted = await repository.baseDeleteById(playerId);
      res.status(200).json({
        message: `Player with id ${playerId} has been properly deleted`,
        playerDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
