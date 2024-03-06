import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdatePlayerAction = createAction("players/update-reset");
const resetDeletePlayerAction = createAction("players/delete-reset");
const resetCreatePlayerAction = createAction("players/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE PLAYER ----------
export const createPlayerAction = createAsyncThunk(
  "players/create",
  async (player, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/player/`;
      const response = await axios.post(endpoint, player, config);

      //Reset update state
      dispatch(resetCreatePlayerAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL PLAYERS ----------
export const getAllPlayersAction = createAsyncThunk(
  "players/get",
  async (player, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/player/`;
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

// ---------- GET PLAYER BY ID ----------
export const getPlayerAction = createAsyncThunk(
  "players/getbyid",
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
      const endpoint = `${baseURL}/api/chachos/player/${id}`;
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

// ---------- UPDATE PLAYER ----------
export const updatePlayerAction = createAsyncThunk(
  "players/update",
  async (player, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/player/${player?.id}`;

      const response = await axios.put(
        endpoint,
        {
          shirt: player?.shirt,
          first_name: player?.first_name,
          last_name: player?.last_name,
          nickname: player?.nickname,
          email: player?.email,
          field_position: player?.field_position,
          bio: player?.bio,
          interview: player?.interview,
        },
        config
      );

      //Reset update state
      dispatch(resetUpdatePlayerAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE PLAYER ----------
export const deletePlayerAction = createAsyncThunk(
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
      const endpoint = `${baseURL}/api/chachos/player/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeletePlayerAction());

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
const playersSlices = createSlice({
  name: "players",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE PLAYER ----------
    builder.addCase(createPlayerAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreatePlayerAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createPlayerAction.fulfilled, (state, action) => {
      state.loading = false;
      state.player = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createPlayerAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL PLAYERS ----------
    builder.addCase(getAllPlayersAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllPlayersAction.fulfilled, (state, action) => {
      state.loading = false;
      state.players = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllPlayersAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET PLAYER BY ID ----------
    builder.addCase(getPlayerAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getPlayerAction.fulfilled, (state, action) => {
      state.loading = false;
      state.player = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getPlayerAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- UPDATE PLAYER ----------
    builder.addCase(updatePlayerAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdatePlayerAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updatePlayerAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedPlayer = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updatePlayerAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE PLAYER ----------
    builder.addCase(deletePlayerAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeletePlayerAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deletePlayerAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedPlayer = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deletePlayerAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default playersSlices.reducer;
