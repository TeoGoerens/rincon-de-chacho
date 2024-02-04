import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdateTournamentAction = createAction("tournaments/update-reset");
const resetDeleteTournamentAction = createAction("tournaments/delete-reset");
const resetCreateTournamentAction = createAction("tournaments/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE TOURNAMENT ----------
export const createTournamentAction = createAsyncThunk(
  "tournaments/create",
  async (tournament, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token = getState().users?.userAuth?.jwt || null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament/`;
      const response = await axios.post(endpoint, tournament, config);

      //Reset update state
      dispatch(resetCreateTournamentAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL TOURNAMENTS ----------
export const getAllTournamentsAction = createAsyncThunk(
  "tournaments/get",
  async (tournament, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token = getState().users?.userAuth?.jwt || null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament/`;
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

// ---------- GET TOURNAMENT BY ID ----------
export const getTournamentAction = createAsyncThunk(
  "tournaments/getbyid",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token = getState().users?.userAuth?.jwt || null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament/${id}`;
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

// ---------- UPDATE TOURNAMENT ----------
export const updateTournamentAction = createAsyncThunk(
  "tournaments/update",
  async (tournament, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token = getState().users?.userAuth?.jwt || null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament/${tournament?.id}`;

      const response = await axios.put(
        endpoint,
        {
          name: tournament?.name,
          year: tournament?.year,
          category: tournament?.category,
        },
        config
      );

      //Reset update state
      dispatch(resetUpdateTournamentAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE TOURNAMENT ----------
export const deleteTournamentAction = createAsyncThunk(
  "tournaments/delete",
  async (id, { rejectWithValue, getState, dispatch }) => {
    try {
      //Retrieve information from the user
      const token = getState().users?.userAuth?.jwt || null;

      //HTTP call
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/chachos/tournament/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeleteTournamentAction());

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
const tournamentsSlices = createSlice({
  name: "tournaments",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE TOURNAMENT ----------
    builder.addCase(createTournamentAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreateTournamentAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createTournamentAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournament = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createTournamentAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL TOURNAMENTS ----------
    builder.addCase(getAllTournamentsAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTournamentsAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournaments = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTournamentsAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET TOURNAMENT BY ID ----------
    builder.addCase(getTournamentAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTournamentAction.fulfilled, (state, action) => {
      state.loading = false;
      state.tournament = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTournamentAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- UPDATE TOURNAMENT ----------
    builder.addCase(updateTournamentAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdateTournamentAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updateTournamentAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedTournament = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updateTournamentAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE TOURNAMENT ----------
    builder.addCase(deleteTournamentAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeleteTournamentAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deleteTournamentAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedTournament = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deleteTournamentAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default tournamentsSlices.reducer;
