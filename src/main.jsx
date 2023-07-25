import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { store } from "./app/store.js";
import { Provider } from "react-redux";
import { extendedApiPostsSlice } from "./features/posts/postsSlice.js";
import { extendedApiUsersSlice } from "./features/users/usersSlice.js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

store.dispatch(extendedApiPostsSlice.endpoints.getPosts.initiate());
store.dispatch(extendedApiUsersSlice.endpoints.getUsers.initiate());

ReactDOM.createRoot(document.getElementById("root")).render(
   <Provider store={store}>
      <Router>
         <Routes>
            <Route path="/*" element={<App />} />
         </Routes>
      </Router>
   </Provider>
);
