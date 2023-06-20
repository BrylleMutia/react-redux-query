import { createSlice, nanoid } from "@reduxjs/toolkit";
import { sub } from "date-fns";

const initialState = [
   {
      id: "1",
      title: "Learning Redux Toolkit",
      content: "I've heard good things",
      date: sub(new Date(), { minutes: 10 }).toISOString(),
      reactions: {
         thumbsUp: 0,
         wow: 0,
         heart: 0,
         rocket: 0,
         coffee: 0,
      },
   },
   {
      id: "2",
      title: "Slices...",
      content: "The more I say slice, the more I want pizza.",
      date: sub(new Date(), { minutes: 5 }).toISOString(),
      reactions: {
         thumbsUp: 0,
         wow: 0,
         heart: 0,
         rocket: 0,
         coffee: 0,
      },
   },
];

const postsSlice = createSlice({
   name: "posts",
   initialState,
   reducers: {
      // inside slice you can mutate state directly
      postAdded: {
         reducer(state, action) {
            state.push(action.payload);
         },
         prepare(title, content, userId) {
            return {
               payload: {
                  id: nanoid(),
                  title,
                  content,
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
         const existingPost = state.find((post) => post.id === postId);

         if (existingPost) {
            // inside slice you can mutate state directly
            existingPost.reactions[reaction]++;
         }
      },
   },
});

// export state for selector so we dont have to change every component once state structure changes
export const selectAllPosts = (state) => state.posts;

// export reducers
export const { postAdded, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;
