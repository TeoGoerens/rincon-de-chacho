import { createAsyncThunk, createSlice, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseURL } from "../../../helpers/baseURL";

// --------------------
// GLOBAL ACTIONS
// --------------------

// ---------- REDIRECT ----------
const resetUpdateAction = createAction("categories/update-reset");
const resetDeleteAction = createAction("categories/delete-reset");
const resetCreateAction = createAction("categories/create-reset");

// --------------------
// ACTIONS
// --------------------

// ---------- CREATE CATEGORY ----------
export const createCategoryAction = createAsyncThunk(
  "categories/create",
  async (category, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/football-category/`;
      const response = await axios.post(endpoint, category, config);

      //Reset update state
      dispatch(resetCreateAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- GET ALL CATEGORIES ----------
export const getAllCategoriesAction = createAsyncThunk(
  "categories/get",
  async (category, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/football-category/`;
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

// ---------- GET CATEGORY BY ID ----------
export const getCategoryAction = createAsyncThunk(
  "categories/getbyid",
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
      const endpoint = `${baseURL}/api/chachos/football-category/${id}`;
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

// ---------- UPDATE CATEGORY ----------
export const updateCategoryAction = createAsyncThunk(
  "categories/update",
  async (category, { rejectWithValue, getState, dispatch }) => {
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
      const endpoint = `${baseURL}/api/chachos/football-category/${category?.id}`;

      const response = await axios.put(
        endpoint,
        { name: category?.name },
        config
      );

      //Reset update state
      dispatch(resetUpdateAction());

      return response.data;
    } catch (error) {
      if (!error?.response) {
        throw error;
      }
      return rejectWithValue(error?.response?.data);
    }
  }
);

// ---------- DELETE CATEGORY ----------
export const deleteCategoryAction = createAsyncThunk(
  "categories/delete",
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
      const endpoint = `${baseURL}/api/chachos/football-category/${id}`;
      const response = await axios.delete(endpoint, config);

      //Reset update state
      dispatch(resetDeleteAction());

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
const footballCategoriesSlices = createSlice({
  name: "football-categories",
  initialState: {},
  extraReducers: (builder) => {
    // ---------- CREATE CATEGORY ----------
    builder.addCase(createCategoryAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetCreateAction, (state, action) => {
      state.isCreated = true;
    });
    builder.addCase(createCategoryAction.fulfilled, (state, action) => {
      state.loading = false;
      state.footballCategory = action?.payload;
      state.isCreated = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(createCategoryAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET ALL CATEGORIES ----------
    builder.addCase(getAllCategoriesAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllCategoriesAction.fulfilled, (state, action) => {
      state.loading = false;
      state.footballCategories = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getAllCategoriesAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- GET CATEGORY BY ID ----------
    builder.addCase(getCategoryAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getCategoryAction.fulfilled, (state, action) => {
      state.loading = false;
      state.footballCategory = action?.payload;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(getCategoryAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- UPDATE CATEGORY ----------
    builder.addCase(updateCategoryAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetUpdateAction, (state, action) => {
      state.isEdited = true;
    });
    builder.addCase(updateCategoryAction.fulfilled, (state, action) => {
      state.loading = false;
      state.updatedCategory = action?.payload;
      state.isEdited = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(updateCategoryAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });

    // ---------- DELETE CATEGORY ----------
    builder.addCase(deleteCategoryAction.pending, (state, action) => {
      state.loading = true;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(resetDeleteAction, (state, action) => {
      state.isDeleted = true;
    });
    builder.addCase(deleteCategoryAction.fulfilled, (state, action) => {
      state.loading = false;
      state.deletedCategory = action?.payload;
      state.isDeleted = false;
      state.appError = undefined;
      state.serverError = undefined;
    });
    builder.addCase(deleteCategoryAction.rejected, (state, action) => {
      state.loading = false;
      state.appError = action?.payload?.message;
      state.serverError = action?.error?.message;
    });
  },
});

export default footballCategoriesSlices.reducer;
