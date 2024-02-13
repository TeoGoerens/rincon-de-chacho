import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetDeleteVoteAction = createAction("votes/delete-reset");
const resetCreateVoteAction = createAction("votes/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE VOTE ----------
export const createVoteAction = createAsyncThunk(
  "votes/create",
  async (vote, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the tournament round
      const tournamentRoundId =
        getState().tournamentRounds?.tournamentRound?.tournamentRound?._id ||
        null;

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
      const endpoint = `${baseURL}/api/chachos/vote/${tournamentRoundId}`;
      const response = await axios.post(endpoint, vote, config);

      //Reset update state
      dispatch(resetCreateVoteAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL VOTES ----------
export const getAllVotesAction = createAsyncThunk(
  "votes/get-all",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve token information from the user
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
      const endpoint = `${baseURL}/api/chachos/vote/`;
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

// ---------- GET VOTE BY VOTER AND TOURNAMENT ROUND ----------
export const getVoteByVoterandTournamentRoundAction = createAsyncThunk(
  "votes/get-by-voter-and-round",
  async (tournamentRoundId, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve token information from the user
      const token =
        getState().users?.userAuth?.jwt ||
        getState().users?.userAuth?.userToDisplay?.jwt ||
        null;

      //Retrieve voter's id
      const voterId =
        getState().users?.userAuth?._id ||
        getState().users?.userAuth?.userToDisplay?._id;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/vote/${tournamentRoundId}/voter/${voterId}`;
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

// ---------- GET VOTES FROM TOURNAMENT ROUND ----------
export const getVotesFromTournamentRoundAction = createAsyncThunk(
  "votes/get-by-round",
  async (tournamentRoundId, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve token information from the user
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
      const endpoint = `${baseURL}/api/chachos/vote/${tournamentRoundId}`;
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

// ---------- DELETE VOTE BY ID ----------
export const deleteVoteByIdAction = createAsyncThunk(
  "players/delete",
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
      const endpoint = `${baseURL}/api/chachos/vote/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeleteVoteAction());

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
const votesSlices = createSlice({
  name: "votes",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE VOTE ----------
    builder.addCase(createVoteAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreateVoteAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createVoteAction.fulfilled, (state, action) => {
      state.loading = false;
      state.vote = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createVoteAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL VOTES ----------
    builder.addCase(getAllVotesAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllVotesAction.fulfilled, (state, action) => {
      state.loading = false;
      state.allVotes = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllVotesAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET VOTE BY VOTER AND ROUND ----------
    builder.addCase(
      getVoteByVoterandTournamentRoundAction.pending,
      (state, action) => {
        state.loading = true;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getVoteByVoterandTournamentRoundAction.fulfilled,
      (state, action) => {
        state.loading = false;
        state.voteByVoterAndRound = action?.payload;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getVoteByVoterandTournamentRoundAction.rejected,
      (state, action) => {
        state.loading = false;
        state.voteByVoterAndRound = undefined;
      }
    );

    // ---------- GET VOTES FROM ROUND ----------
    builder.addCase(
      getVotesFromTournamentRoundAction.pending,
      (state, action) => {
        state.loading = true;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getVotesFromTournamentRoundAction.fulfilled,
      (state, action) => {
        state.loading = false;
        state.votesFromRound = action?.payload;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      getVotesFromTournamentRoundAction.rejected,
      (state, action) => {
        state.loading = false;
        state.votesFromRound = undefined;
      }
    );

    // ---------- DELETE VOTE BY ID ----------
    builder.addCase(deleteVoteByIdAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeleteVoteAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deleteVoteByIdAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedVote = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deleteVoteByIdAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default votesSlices.reducer;
