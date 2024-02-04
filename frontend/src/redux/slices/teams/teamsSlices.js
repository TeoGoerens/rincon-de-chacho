import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdateTeamAction = createAction("teams/update-reset");
const resetDeleteTeamAction = createAction("teams/delete-reset");
const resetCreateTeamAction = createAction("teams/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE TEAM ----------
export const createTeamAction = createAsyncThunk(
  "teams/create",
  async (team, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/rival-team/`;
      const response = await axios.post(endpoint, team, config);

      //Reset update state
      dispatch(resetCreateTeamAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL TEAMS ----------
export const getAllTeamsAction = createAsyncThunk(
  "teams/get",
  async (teams, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/rival-team/`;
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

// ---------- GET TEAM BY ID ----------
export const getTeamAction = createAsyncThunk(
  "teams/getbyid",
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
      const endpoint = `${baseURL}/api/chachos/rival-team/${id}`;
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

// ---------- UPDATE TEAM ----------
export const updateTeamAction = createAsyncThunk(
  "teams/update",
  async (team, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/rival-team/${team?.id}`;

      const response = await axios.put(
        endpoint,
        {
          avatar: team?.avatar,
          name: team?.name,
        },
        config
      );

      //Reset update state
      dispatch(resetUpdateTeamAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE TEAM ----------
export const deleteTeamAction = createAsyncThunk(
  "teams/delete",
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
      const endpoint = `${baseURL}/api/chachos/rival-team/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeleteTeamAction());

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
const teamsSlices = createSlice({
  name: "teams",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE TEAM ----------
    builder.addCase(createTeamAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreateTeamAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createTeamAction.fulfilled, (state, action) => {
      state.loading = false;
      state.team = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createTeamAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL TEAMS ----------
    builder.addCase(getAllTeamsAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTeamsAction.fulfilled, (state, action) => {
      state.loading = false;
      state.teams = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllTeamsAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET TEAM BY ID ----------
    builder.addCase(getTeamAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTeamAction.fulfilled, (state, action) => {
      state.loading = false;
      state.team = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getTeamAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- UPDATE TEAM ----------
    builder.addCase(updateTeamAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdateTeamAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updateTeamAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedTeam = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updateTeamAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE TEAM ----------
    builder.addCase(deleteTeamAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeleteTeamAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deleteTeamAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedTeam = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deleteTeamAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default teamsSlices.reducer;
