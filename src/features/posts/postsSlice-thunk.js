import {
   createSlice,
   createAsyncThunk,
   createSelector,
   createEntityAdapter,
} from "@reduxjs/toolkit";
import { sub } from "date-fns";
import axios from "axios";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const postsAdapter = createEntityAdapter({
   sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState({
   // getInitialState returns the default normalized structure already, we just added additional state
   status: "idle", // idle | loading | succeded | failed
   error: null,
   count: 0,
});

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
   try {
      const response = await axios.get(POSTS_URL);
      return [...response.data];
   } catch (err) {
      return err.message;
   }
});

export const addNewPost = createAsyncThunk(
   "posts/addNewPost",
   async (initialPost) => {
      try {
         const response = await axios.post(POSTS_URL, initialPost);
         return response.data;
      } catch (err) {
         return err.message;
      }
   }
);

export const updatePost = createAsyncThunk(
   "posts/updatePost",
   async (initialPost) => {
      const { id } = initialPost;

      try {
         const response = await axios.put(`${POSTS_URL}/${id}`, initialPost);
         return response.data;
      } catch (err) {
         return err.message;
      }
   }
);

export const deletePost = createAsyncThunk(
   "posts/deletePost",
   async (initialPost) => {
      const { id } = initialPost;

      try {
         const response = await axios.delete(`${POSTS_URL}/${id}`);
         if (response.status === 200) return initialPost;
         return `${response?.status}: ${response.statusText}`;
      } catch (err) {
         return err.message;
      }
   }
);

const postsSlice = createSlice({
   name: "posts",
   initialState,
   reducers: {
      // inside slice you can mutate state directly
      reactionAdded(state, action) {
         const { postId, reaction } = action.payload;
         // const existingPost = state.posts.find((post) => post.id === postId);
         const existingPost = state.entities[postId];

         if (existingPost) {
            // inside slice you can mutate state directly
            existingPost.reactions[reaction]++;
         }
      },
      increaseCount(state, action) {
         state.count += 1;
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
            // state.posts = state.posts.concat(loadedPosts);
            postsAdapter.upsertMany(state, action.payload);
         })
         .addCase(fetchPosts.rejected, (state, action) => {
            state.status = "failed";
            state.error = action.error.message;
         })
         .addCase(addNewPost.fulfilled, (state, action) => {
            action.payload.userId = Number(action.payload.userId);
            action.payload.date = new Date().toISOString();
            action.payload.reactions = {
               thumbsUp: 0,
               wow: 0,
               heart: 0,
               rocket: 0,
               coffee: 0,
            };

            console.log(action.payload);
            // state.posts.push(action.payload);
            postsAdapter.addOne(state, action.payload);
         })
         .addCase(updatePost.fulfilled, (state, action) => {
            if (!action.payload?.id) {
               console.log("Update not completed!");
               console.log(action.payload);
               return;
            }

            // const { id } = action.payload;
            action.payload.date = new Date().toISOString();
            // const posts = state.posts.filter((post) => post.id !== id);
            // state.posts = [...posts, action.payload];
            postsAdapter.upsertOne(state, action.payload);
         })
         .addCase(deletePost.fulfilled, (state, action) => {
            if (!action.payload?.id) {
               console.log("Delete could not be completed");
               console.log(action.payload);
               return;
            }

            const { id } = action.payload;
            // const posts = state.posts.filter((post) => post.id !== id);
            // state.posts = posts;
            postsAdapter.removeOne(state, id);
         });
   },
});


// getSelectors creates these selectors and we rename them with aliases using desctructuring
export const { 
   selectAll: selectAllPosts,
   selectById: selectPostById,
   selectIds: selectPostIds
} = postsAdapter.getSelectors(state => state.posts); // pass in a selector that returns posts slice of state

// export state for selector so we dont have to change every component once state structure changes
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;
export const getCount = (state) => state.posts.count;

// memoized selector (caching), will only update once dependencies update
export const selectPostsByUser = createSelector(
   [selectAllPosts, (state, userId) => userId], // input dependencies / arrow function is used because its an input from the function call
   (posts, userId) => posts.filter((post) => post.userId === userId) // output function
);

// export reducers
export const { increaseCount, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
