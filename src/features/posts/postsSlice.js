import { createSlice, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import { sub } from "date-fns";
import axios from "axios";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const initialState = {
   posts: [],
   status: "idle", // idle | loading | succeded | failed
   error: null,
};

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
   try {
      const response = await axios.get(POSTS_URL);
      return [...response.data];
   } catch (err) {
      return err.message;
   }
});

const postsSlice = createSlice({
   name: "posts",
   initialState,
   reducers: {
      // inside slice you can mutate state directly
      postAdded: {
         reducer(state, action) {
            state.posts.push(action.payload);
         },
         prepare(title, body, userId) {
            return {
               payload: {
                  id: nanoid(),
                  title,
                  body,
                  date: new Date().toISOString(),
                  userId: Number(userId),
                  reactions: {
                     thumbsUp: 0,
                     wow: 0,
                     heart: 0,
                     rocket: 0,
                     coffee: 0,
                  },
               },
            };
         },
      },
      reactionAdded(state, action) {
         const { postId, reaction } = action.payload;
         const existingPost = state.posts.find((post) => post.id === postId);

         if (existingPost) {
            // inside slice you can mutate state directly
            existingPost.reactions[reaction]++;
         }
      },
   },
   extraReducers(builder) {
      builder
         .addCase(fetchPosts.pending, (state, action) => {
            state.status = "loading";
         })
         .addCase(fetchPosts.fulfilled, (state, action) => {
            state.status = "succeeded";

            // add date and reactions
            let min = 1;
            const loadedPosts = action.payload.map((post) => {
               post.date = sub(new Date(), { minutes: min++ }).toISOString();
               post.reactions = {
                  thumbsUp: 0,
                  wow: 0,
                  heart: 0,
                  rocket: 0,
                  coffee: 0,
               };

               return post;
            });

            // add fetched posts to state array
            state.posts = state.posts.concat(loadedPosts);
         })
         .addCase(fetchPosts.rejected, (state, action) => {
            state.status = "failed";
            state.error = action.error.message;
         });
   },
});

// export state for selector so we dont have to change every component once state structure changes
export const selectAllPosts = (state) => state.posts.posts;
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;

// export reducers
export const { postAdded, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
