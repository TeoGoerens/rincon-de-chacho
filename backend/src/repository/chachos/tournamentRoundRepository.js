import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import User from "../../dao/models/userModel.js";
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

    for (const user of registeredUsers) {
      const mailOptions = {
        from: "chacho@elrincondechacho.com",
        to: user.email,
        subject: "¡Atención chacal! Nueva fecha para votar",
        html: `
        <h1>Hola ${user.first_name},</h1>
        <h3>Se abrió la votación para una nueva fecha de Chachos.</h3>
        <p>No te pierdas la posibilidad de elegir las perlas y puntuar a cada uno de los jugadores.</p>
        <p>Apurate e ingresá en el link debajo para dejar tu voto:</p>
        <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}">Ver Fecha</a>
      `,
      };
      let mailSent = await transport.sendMail(mailOptions);

      return mailSent;
    }
  };

  // ---------- SEND EMAIL TO USERS TO DISPLAY RESULTS ----------
  sendEmailToAllUsersToDisplayResults = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    for (const user of registeredUsers) {
      const mailOptions = {
        from: "chacho@elrincondechacho.com",
        to: user.email,
        subject: "¡Se cerró la votación! Mirá los resultados",
        html: `
          <h1>Hola ${user.first_name},</h1>
          <h3>Espero que no te hayas dormido y hayas dejado tu voto a tiempo.</h3>
          <p>Ya cerró la fecha así que vas a poder consultar quiénes fueron los jugadores más destacados.</p>
          <p>Ingresá en el link debajo para ver los resultados:</p>
          <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}">Ver Fecha</a>
        `,
      };
      let mailSent = await transport.sendMail(mailOptions);

      return mailSent;
    }
  };
}
