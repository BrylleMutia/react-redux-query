import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import sub from "date-fns/sub";
import { apiSlice } from "../api/apiSlice";

const usersAdapter = createEntityAdapter({
   sortComparer: (a, b) => String(b.id).localeCompare(String(a.id)),
});

const initialState = usersAdapter.getInitialState();

export const extendedApiUsersSlice = apiSlice.injectEndpoints({
   endpoints: (builder) => ({
      getUsers: builder.query({
         query: () => "/users",
         transformResponse: (responseData) => {
            return usersAdapter.setAll(initialState, responseData);
         },
         providesTags: (result, error, arg) => [
            { type: "User", id: "List" },
            ...result.ids.map((id) => ({ type: "User", id })),
         ],
      }),
   }),
});

export const { useGetUsersQuery } = extendedApiUsersSlice;

export const selectUsersResult =
   extendedApiUsersSlice.endpoints.getUsers.select();
const selectUsersData = createSelector(
   selectUsersResult,
   (usersResult) => usersResult.data
);

export const { selectAll: selectAllUsers, selectById: selectUserById } =
   usersAdapter.getSelectors((state) => selectUsersData(state) ?? initialState);
