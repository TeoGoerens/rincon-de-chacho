import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";
import {
  getIsAdminFromLocalStorage,
  getUserInfoFromLocalStorage,
} from "../../../helpers/userInfoFromLocalStorage";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetLoginAction = createAction("users/login-reset");
const resetLogoutAction = createAction("users/logout-reset");
export const resetAllUsersErrorsAction = createAction("users/errors-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- REGISTER ACTION ----------
export const registerUserAction = createAsyncThunk(
  "users/register",
  async (user, { rejectWithValue, getState, dispatch }) => {
    try {
      //HTTP call
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/users/register`;
      const response = await axios.post(endpoint, user, config);
      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- LOGIN ACTION ----------
export const loginUserAction = createAsyncThunk(
  "users/login",
  async (user, { rejectWithValue, getState, dispatch }) => {
    try {
      //HTTP call
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/users/login`;
      const response = await axios.post(endpoint, user, config);

      //Save user in local storage
      localStorage.setItem(
        "userInfo",
        JSON.stringify(response.data.userToDisplay)
      );

      //Reset update state
      dispatch(resetLoginAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- LOGOUT ACTION ----------
export const logoutUserAction = createAsyncThunk(
  "users/logout",
  async (user, { rejectWithValue, getState, dispatch }) => {
    try {
      //Remove user from local storage
      localStorage.removeItem("userInfo");

      //Reset update state
      dispatch(resetLogoutAction());
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- RESET PASSWORD TOKEN GENERATOR ----------
export const resetPasswordTokenGeneratorAction = createAsyncThunk(
  "users/reset-password-token-generator",
  async (email, { rejectWithValue, getState, dispatch }) => {
    try {
      //HTTP call
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/users/forgot-password`;
      const response = await axios.post(endpoint, email, config);

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- RESET PASSWORD ----------
export const resetPasswordAction = createAsyncThunk(
  "users/reset-password",
  async (data, { rejectWithValue, getState, dispatch }) => {
    try {
      //HTTP call
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const endpoint = `${baseURL}/api/users/reset-password`;
      const response = await axios.put(endpoint, data, config);

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
const userSlices = createSlice({
  name: "users",
  initialState: {
    userAuth: getUserInfoFromLocalStorage,
    isAdmin: getIsAdminFromLocalStorage,
  },
  extraReducers: (builder) => {
    // ---------- RESET ERRORS ----------
    builder.addCase(resetAllUsersErrorsAction, (state, action) => {
      state.appError = undefined;
      state.serverError = undefined;
      state.resetTokenCreated = undefined;
      state.passwordReset = undefined;
    });

    // ---------- USER REGISTER ----------
    builder.addCase(registerUserAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(registerUserAction.fulfilled, (state, action) => {
      state.loading = false;
      state.registered = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(registerUserAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- USER LOGIN ----------
    builder.addCase(loginUserAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetLoginAction, (state, action) => {
      state.isLoggedIn = true;
    });
    builder.addCase(loginUserAction.fulfilled, (state, action) => {
      state.loading = false;
      state.userAuth = action?.payload;
      state.isAdmin = action?.payload.userToDisplay.is_admin;
      state.isLoggedIn = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(loginUserAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- USER LOGOUT ----------
    builder.addCase(logoutUserAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(logoutUserAction.fulfilled, (state, action) => {
      state.loading = false;
      state.userAuth = undefined;
      state.isAdmin = undefined;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(logoutUserAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- PASSWORD RESET TOKEN GENERATOR ----------
    builder.addCase(
      resetPasswordTokenGeneratorAction.pending,
      (state, action) => {
        state.loading = true;
        state.appError = undefined;
        state.serverError = undefined;
        state.resetTokenCreated = undefined;
      }
    );
    builder.addCase(
      resetPasswordTokenGeneratorAction.fulfilled,
      (state, action) => {
        state.loading = false;
        state.resetTokenCreated = action?.payload;
        state.appError = undefined;
        state.serverError = undefined;
      }
    );
    builder.addCase(
      resetPasswordTokenGeneratorAction.rejected,
      (state, action) => {
        state.loading = false;
        state.appError = action?.payload?.message;
        state.serverError = action?.error?.message;
        state.resetTokenCreated = undefined;
      }
    );

    // ---------- PASSWORD RESET ----------
    builder.addCase(resetPasswordAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
      state.passwordReset = undefined;
    });
    builder.addCase(resetPasswordAction.fulfilled, (state, action) => {
      state.loading = false;
      state.passwordReset = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetPasswordAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
      state.passwordReset = undefined;
    });
  },
});

export default userSlices.reducer;
