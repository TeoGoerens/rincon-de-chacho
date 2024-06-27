import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";
import { simplifyVotesInformation } from "../../../helpers/simplifiedVotesForAxios";
import { simplifyPointsInformation } from "../../../helpers/simplifiedPointsForAxios";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdateTournamentRoundAction = createAction(
  "tournament-rounds/update-reset"
);
const resetConsolidatePearlsAction = createAction(
  "tournament-rounds/consolidate-pearls-reset"
);
const resetDeleteTournamentRoundAction = createAction(
  "tournament-rounds/delete-reset"
);
const resetCreateTournamentRoundAction = createAction(
  "tournament-rounds/create-reset"
);
const resetUpdateOpenForVoteAction = createAction(
  "tournament-rounds/open-for-vote-reset"
);

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE TOURNAMENT ROUND ----------
export const createTournamentRoundAction = createAsyncThunk(
  "tournament-rounds/create",
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
      const endpoint = `${baseURL}/api/chachos/tournament-round/`;
      const response = await axios.post(endpoint, tournamentRound, config);

      //Reset update state
      dispatch(resetCreateTournamentRoundAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL TOURNAMENT ROUNDS ----------
export const getAllTournamentRoundsAction = createAsyncThunk(
  "tournament-rounds/get",
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
      const endpoint = `${baseURL}/api/chachos/tournament-round/`;
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
  "tournament-rounds/getbyid",
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
  "tournament-rounds/get-by-tournament",
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
  "tournament-rounds/update",
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
          month:
            new Date(Date.parse(tournamentRound?.match_date)).getMonth() + 1,
          year: new Date(Date.parse(tournamentRound?.match_date)).getFullYear(),
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

// ---------- CONSOLIDATE PEARLS ----------
export const consolidatePearlsAction = createAsyncThunk(
  "tournament-rounds/consolidate-pearls",
  async (tournamentRound, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      const fullVotes =
        getState().votes?.votesFromRound?.allVotesForRound || null;

      const votes = simplifyVotesInformation(fullVotes);
      const points = simplifyPointsInformation(fullVotes);

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament-round/consolidate-pearls/${tournamentRound}`;

      const response = await axios.put(
        endpoint,
        {
          votes,
          points,
        },
        config
      );

      //Reset update state
      dispatch(resetConsolidatePearlsAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE TOURNAMENT ROUND ----------
export const deleteTournamentRoundAction = createAsyncThunk(
  "tournament-rounds/delete",
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
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeleteTournamentRoundAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- UPDATE OPEN FOR VOTE ----------
export const updateOpenForVoteAction = createAsyncThunk(
  "tournament-rounds/update/open-for-vote",
  async (tournamentRoundId, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/tournament-round/open-for-vote/${tournamentRoundId}`;

      const response = await axios.put(
        endpoint,
        { tournamentRoundId: tournamentRoundId },
        config
      );

      //Reset update state
      dispatch(resetUpdateOpenForVoteAction());

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
const tournamentRoundsSlices = createSlice({
  name: "tournament-rounds",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE TOURNAMENT ROUND ----------
    builder.addCase(createTournamentRoundAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreateTournamentRoundAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createTournamentRoundAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournamentRound = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createTournamentRoundAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL TOURNAMENT ROUNDS ----------
    builder.addCase(getAllTournamentRoundsAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTournamentRoundsAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournamentRounds = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTournamentRoundsAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET TOURNAMENT ROUND BY ID ----------
    builder.addCase(getTournamentRoundAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTournamentRoundAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournamentRound = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTournamentRoundAction.rejected, (state, action) => {
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

    // ---------- CONSOLIDATE PEARLS ----------
    builder.addCase(consolidatePearlsAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetConsolidatePearlsAction, (state, action) => {
      state.arePearlsConsolidated = true;
    });
    builder.addCase(consolidatePearlsAction.fulfilled, (state, action) => {
      state.loading = false;
      state.TournamentRoundWithPearls = action?.payload;
      state.arePearlsConsolidated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(consolidatePearlsAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE TOURNAMENT ROUND ----------
    builder.addCase(deleteTournamentRoundAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeleteTournamentRoundAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deleteTournamentRoundAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedTournamentRound = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deleteTournamentRoundAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- UPDATE OPEN FOR VOTE ----------
    builder.addCase(updateOpenForVoteAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdateOpenForVoteAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updateOpenForVoteAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedTournamentRound = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updateOpenForVoteAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default tournamentRoundsSlices.reducer;
