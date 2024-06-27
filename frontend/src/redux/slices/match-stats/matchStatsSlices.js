import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";
import { queryStringCreator } from "../../../helpers/queryStringCreator";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdateTournamentRoundAction = createAction(
  "match-stats/update-reset"
);
const resetConsolidatePearlsAction = createAction(
  "match-stats/consolidate-pearls-reset"
);
const resetdeleteMatchStatsForARoundAction = createAction(
  "match-stats/delete-reset"
);
const resetcreateMatchStatAction = createAction("match-stats/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE MATCH STAT ----------
export const createMatchStatAction = createAsyncThunk(
  "match-stats/create",
  async (matchStats, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;
      const tournamentRoundId =
        getState().tournamentRounds?.tournamentRound?.tournamentRound?._id;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/match-stat/${tournamentRoundId}`;
      const response = await axios.post(endpoint, matchStats, config);

      //Reset update state
      dispatch(resetcreateMatchStatAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET MATCH STATS FILTERED ----------
export const getMatchStatsFilteredAction = createAsyncThunk(
  "match-stats/get-filtered",
  async (filterOptions, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //Transform the filter options into a query string
      const queryString = queryStringCreator(filterOptions);

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/match-stat/filtered?${queryString}`;
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET TOURNAMENT ROUND BY ID ----------
export const getTournamentRoundAction = createAsyncThunk(
  "match-stats/getbyid",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament-round/${id}`;
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ROUNDS BY TOURNAMENT ----------
export const getTournamentRoundsByTournamentAction = createAsyncThunk(
  "match-stats/get-by-tournament",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament-round/tournament/${id}`;
      const response = await axios.get(endpoint, config);
      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- UPDATE TOURNAMENT ROUND ----------
export const updateTournamentRoundAction = createAsyncThunk(
  "match-stats/update",
  async (tournamentRound, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament-round/${tournamentRound?.id}`;

      const response = await axios.put(
        endpoint,
        {
          tournament: tournamentRound?.tournament,
          rival: tournamentRound?.rival,
          match_date: tournamentRound?.match_date,
          score_chachos: tournamentRound?.score_chachos,
          score_rival: tournamentRound?.score_rival,
          players: tournamentRound?.players,
        },
        config
      );

      //Reset update state
      dispatch(resetUpdateTournamentRoundAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE MATCH STATS FOR A CERTAIN ROUND ----------
export const deleteMatchStatsForARoundAction = createAsyncThunk(
  "match-stats/delete",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/match-stat/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetdeleteMatchStatsForARoundAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// --------------------
// SLICES
// --------------------
const matchStatsSlices = createSlice({
  name: "match-stats",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE MATCH STAT ----------
    builder.addCase(createMatchStatAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetcreateMatchStatAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createMatchStatAction.fulfilled, (state, action) => {
      state.loading = false;
      state.matchStats = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createMatchStatAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET MATCH STATS FILTERED ----------
    builder.addCase(getMatchStatsFilteredAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getMatchStatsFilteredAction.fulfilled, (state, action) => {
      state.loading = false;
      state.filteredMatchStats = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getMatchStatsFilteredAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ROUNDS BY TOURNAMENT ----------
    builder.addCase(
      getTournamentRoundsByTournamentAction.pending,
      (state, action) => {
        state.loading = true;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getTournamentRoundsByTournamentAction.fulfilled,
      (state, action) => {
        state.loading = false;
        state.tournamentRoundsByTournament = action?.payload;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getTournamentRoundsByTournamentAction.rejected,
      (state, action) => {
        state.loading = false;
        state.appError = action?.payload?.message;
        state.serverError = action?.error?.message;
      }
    );

    // ---------- UPDATE TOURNAMENT ROUND ----------
    builder.addCase(updateTournamentRoundAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdateTournamentRoundAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updateTournamentRoundAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedTournamentRound = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updateTournamentRoundAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE MATCH STAT FOR A A TOURNAMENT ROUND ----------
    builder.addCase(
      deleteMatchStatsForARoundAction.pending,
      (state, action) => {
        state.loading = true;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(resetdeleteMatchStatsForARoundAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(
      deleteMatchStatsForARoundAction.fulfilled,
      (state, action) => {
        state.loading = false;
        state.deletedTournamentRound = action?.payload;
        state.isDeleted = false;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      deleteMatchStatsForARoundAction.rejected,
      (state, action) => {
        state.loading = false;
        state.appError = action?.payload?.message;
        state.serverError = action?.error?.message;
      }
    );
  },
});

export default matchStatsSlices.reducer;
