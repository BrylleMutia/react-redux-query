import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { sub } from "date-fns";
import { apiSlice } from "../api/apiSlice";

const postsAdapter = createEntityAdapter({
   sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState();

export const extendedApiPostsSlice = apiSlice.injectEndpoints({
   endpoints: (builder) => ({
      getPosts: builder.query({
         query: () => "/posts",
         transformResponse: (responseData) => {
            let min = 1;
            const loadedPosts = responseData.map((post) => {
               if (!post.date)
                  post.date = sub(new Date(), { minutes: min++ }).toISOString();
               if (!post.reactions)
                  post.reactions = {
                     thumbsUp: 0,
                     wow: 0,
                     heart: 0,
                     rocket: 0,
                     coffee: 0,
                  };

               return post;
            });

            return postsAdapter.setAll(initialState, loadedPosts);
         },
         providesTags: (result, error, arg) => [
            // arg is the parameter used on query function above
            { type: "Post", id: "LIST" },
            ...result.ids.map((id) => ({ type: "Post", id })), // provide a unique tag for each post, so we can update those individually
         ],
      }),
      getPostsByUserId: builder.query({
         query: (id) => `/posts/?userId=${id}`,
         transformResponse: (responseData) => {
            let min = 1;
            const loadedPosts = responseData.map((post) => {
               if (!post?.date)
                  post.date = sub(new Date(), { minutes: min++ }).toISOString();
               if (!post?.reactions)
                  post.reactions = {
                     thumbsUp: 0,
                     wow: 0,
                     heart: 0,
                     rocket: 0,
                     coffee: 0,
                  };
               return post;
            });
            return postsAdapter.setAll(initialState, loadedPosts);
         },
         providesTags: (result, error, arg) => [
            ...result.ids.map((id) => ({ type: "Post", id })),
         ],
      }),
      addNewPost: builder.mutation({
         query: (initialPost) => ({
            url: "/posts",
            method: "POST",
            body: {
               ...initialPost,
               userId: Number(initialPost.userId),
               date: new Date().toISOString(),
               reactions: {
                  thumbsUp: 0,
                  wow: 0,
                  heart: 0,
                  rocket: 0,
                  coffee: 0,
               },
            },
         }),
         invalidatesTags: [{ type: "Post", id: "LIST" }],
      }),
      updatePost: builder.mutation({
         query: (initialPost) => ({
            url: `/posts/${initialPost.id}`,
            method: "PUT",
            body: {
               ...initialPost,
               date: new Date().toISOString(),
            },
         }),
         invalidatesTags: (result, error, arg) => [
            { type: "Post", id: arg.id },
         ],
      }),
      deletePost: builder.mutation({
         query: ({ id }) => ({
            url: `/posts/${id}`,
            method: "DELETE",
            body: { id },
         }),
         invalidatesTags: (result, error, arg) => [
            { type: "Post", id: arg.id },
         ],
      }),
      // this is an optimistic update, meaning we update the cache data even before we get updates from the API
      addReaction: builder.mutation({
         query: ({ postId, reactions }) => ({
            url: `posts/${postId}`,
            method: "PATCH",
            // In a real app, we'd probably need to base this on user ID somehow
            // so that a user can't do the same reaction more than once
            body: { reactions },
         }),
         async onQueryStarted(
            { postId, reactions },
            { dispatch, queryFulfilled }
         ) {
            // `updateQueryData` requires the endpoint name and cache key arguments,
            // so it knows which piece of cache state to update
            const patchResult = dispatch(
               extendedApiPostsSlice.util.updateQueryData(
                  "getPosts",
                  undefined,
                  (draft) => {
                     // The `draft` is Immer-wrapped and can be "mutated" like in createSlice
                     const post = draft.entities[postId];
                     if (post) post.reactions = reactions;
                  }
               )
            );
            try {
               await queryFulfilled;
            } catch {
               patchResult.undo();
            }
         },
      }),
   }),
});

export const {
   useGetPostsQuery,
   useGetPostsByUserIdQuery,
   useAddNewPostMutation,
   useUpdatePostMutation,
   useDeletePostMutation,
   useAddReactionMutation,
} = extendedApiPostsSlice;

// returns the query result object
export const selectPostsResult =
   extendedApiPostsSlice.endpoints.getPosts.select();

// creates memoized selector
// usage of this is so we can only return the normalized state instead of the whole object returned from the getposts query
const selectPostsData = createSelector(
   selectPostsResult,
   (postsResult) => postsResult.data // normalized state object with ids and entities
);

// getSelectors creates these selectors and we rename them with aliases using desctructuring
export const {
   selectAll: selectAllPosts,
   selectById: selectPostById,
   selectIds: selectPostIds,
} = postsAdapter.getSelectors(
   (state) => selectPostsData(state) ?? initialState
); // pass in a selector that returns posts slice of state
