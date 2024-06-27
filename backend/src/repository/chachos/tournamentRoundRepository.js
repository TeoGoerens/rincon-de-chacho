import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import User from "../../dao/models/userModel.js";
import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import baseRepository from "../baseRepository.js";
import transport from "../../config/email/nodemailer.js";

export default class TournamentRoundRepository extends baseRepository {
  constructor() {
    super(TournamentRound);
  }

  // ---------- GET ROUNDS BY TOURNAMENT ----------
  getTournamentRoundsByTournament = async (tournamentRoundId) => {
    try {
      const document = await this.model
        .find({ tournament: tournamentRoundId })
        .populate([
          "tournament",
          "rival",
          "players",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ]);
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- PLAYERS DETAILS FROM TOURNAMENT ROUND ----------
  getPlayersDetailFromTournamentRound = async (tournamentRoundId) => {
    try {
      const document = await this.model
        .findById(tournamentRoundId)
        .populate("players");
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- SEND EMAIL TO USERS REQUESTING VOTES ----------
  sendEmailToAllUsersToRequestVotes = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    const mailOptionsList = registeredUsers.map((user) => ({
      from: "chacho@elrincondechacho.com",
      to: user.email,
      subject: "¡Atención chacal! Nueva fecha para votar",
      html: `
      <h1>Hola ${user.first_name},</h1>
      <h3>Se abrió la votación para una nueva fecha de Chachos.</h3>
      <p>No te pierdas la posibilidad de elegir las perlas y puntuar a cada uno de los jugadores.</p>
      <p>Apurate e ingresá en el link debajo para dejar tu voto:</p>
      <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}/results">Ver Fecha</a>
    `,
    }));

    await Promise.all(
      mailOptionsList.map((mailOptions) => transport.sendMail(mailOptions))
    );
  };

  // ---------- SEND EMAIL TO USERS TO DISPLAY RESULTS ----------
  sendEmailToAllUsersToDisplayResults = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    const mailOptionsList = registeredUsers.map((user) => ({
      from: "chacho@elrincondechacho.com",
      to: user.email,
      subject: "¡Se cerró la votación! Mirá los resultados",
      html: `
        <h1>Hola ${user.first_name},</h1>
        <h3>Espero que no te hayas dormido y hayas dejado tu voto a tiempo.</h3>
        <p>Ya cerró la fecha así que vas a poder consultar quiénes fueron los jugadores más destacados.</p>
        <p>Ingresá en el link debajo para ver los resultados:</p>
        <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}/results">Ver Fecha</a>
      `,
    }));

    await Promise.all(
      mailOptionsList.map((mailOptions) => transport.sendMail(mailOptions))
    );
  };

  // ---------- UPDATE MATCH STATS FROM VOTES ----------
  updateMatchStatsFromVotes = async (
    tournamentRoundId,
    whitePearl,
    vanillaPearl,
    ocherPearl,
    blackPearl
  ) => {
    try {
      //Update white pearl
      const whitePearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: whitePearl,
      });
      if (!whitePearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as white pearl has not been created"
        );
      } else {
        whitePearlUpdate[0].white_pearl = true;
        await whitePearlUpdate[0].save();
      }

      //Update vanilla pearl
      const vanillaPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: vanillaPearl,
      });
      if (!vanillaPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as vanilla pearl has not been created"
        );
      } else {
        vanillaPearlUpdate[0].vanilla_pearl = true;
        await vanillaPearlUpdate[0].save();
      }

      //Update ocher pearl
      const ocherPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: ocherPearl,
      });
      if (!ocherPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as ocher pearl has not been created"
        );
      } else {
        ocherPearlUpdate[0].ocher_pearl = true;
        await ocherPearlUpdate[0].save();
      }

      //Update black pearl
      const blackPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: blackPearl,
      });
      if (!blackPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as white pearl has not been created"
        );
      } else {
        blackPearlUpdate[0].black_pearl = true;
        await blackPearlUpdate[0].save();
      }

      return [
        whitePearlUpdate,
        vanillaPearlUpdate,
        ocherPearlUpdate,
        blackPearlUpdate,
      ];
    } catch (error) {
      throw error;
    }
  };

  // ---------- UPDATE MATCH STATS FROM POINTS ----------
  updateMatchStatsFromPoints = async (tournamentRoundId, pointsArray) => {
    try {
      //Creo una variable para almacenar los match stats actualizados
      let updatedMatchStats = [];

      //Recorro el array de puntos y actualizo la coleccion match stat
      for (const element of pointsArray) {
        const matchStatToUpdate = await MatchStat.find({
          round: tournamentRoundId,
          player: element.player,
        });
        if (!matchStatToUpdate.length) {
          throw new Error("Match stat for player chosen has not been created");
        } else {
          matchStatToUpdate[0].points = element.averagePoints;
          await matchStatToUpdate[0].save();

          updatedMatchStats.push(matchStatToUpdate[0]);
        }
      }

      return updatedMatchStats;
    } catch (error) {
      throw error;
    }
  };
}
