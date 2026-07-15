import {
  getSupportedLeagues,
  getUpcomingEventsByLeague,
} from "../../integrations/sportsProvider/index.js";

export default class ProdeSportsController {
  /* --------------- GET SUPPORTED LEAGUES --------------- */
  getSupportedLeagues = async (req, res, next) => {
    try {
      const leagues = getSupportedLeagues();
      res.status(200).json({
        message: "Supported leagues retrieved successfully",
        leagues,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET UPCOMING EVENTS BY LEAGUE --------------- */
  getUpcomingEventsByLeague = async (req, res, next) => {
    try {
      const events = await getUpcomingEventsByLeague(req.params.leagueId);
      res.status(200).json({
        message: "Upcoming events retrieved successfully",
        events,
      });
    } catch (error) {
      next(error);
    }
  };
}
