import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import usersReducer from "../features/users/usersSlice";
import { apiSlice } from "../features/api/apiSlice";

export const store = configureStore({
   reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      users: usersReducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware), // middleware is required when using rtk query with the store 
});
