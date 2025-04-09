import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch } from "react-redux";
import {
  BrowserRouter,
  HashRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { selectUser } from "selectors";
import useTreeChanges from "tree-changes-hook";
import { useAppSelector } from "modules/hooks";

import toast, { Toaster } from "react-hot-toast";

import { getUser } from "actions";
import Login from "./routes/Login";
import Dash from "./routes/Dash";
import Flow from "./routes/Flow";
import AccountSelect from "./routes/AccountSelect";
import Integrations from "./routes/Integrations";
import NotFound from "routes/NotFound";
import PublicRoute from "./components/PublicRoute";
import PrivateRoute from "./components/PrivateRoute";
import Settings from "./routes/Settings";

function Root() {
  const dispatch = useDispatch();
  const userState = useAppSelector(selectUser);
  const { changed } = useTreeChanges(userState);

  const { user } = userState;
  const { isLoggedIn } = user;

  useEffect(() => {
    // get user details if it is the first time
    dispatch(getUser());
  }, []);

  useEffect(() => {
    if (changed("user.isLoggedIn", true) && isLoggedIn) {
      // toast.success("Logged In!");
    }
  }, [dispatch, changed]);

  // THOUGHTS 102
  // For some reason, hard refresh on the urls is giving 404 if we use BrowserRouter in production

  // const Router = process.env.REACT_APP_ELECTRON ? HashRouter : BrowserRouter;
  // const Router = HashRouter;
  const Router = BrowserRouter;

  Helmet.defaultProps.encodeSpecialCharacters = false;

  return (
    <Router>
      <div className="w-full h-full flex-grow flex flex-col">
        <Helmet
          defaultTitle={"Browserable"}
          defer={false}
          encodeSpecialCharacters={false}
          titleAttributes={{ itemprop: "name", lang: "en-en" }}
          titleTemplate={`%s | Browserable`}
        >
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap"
            rel="stylesheet"
          />
        </Helmet>
        <Routes className="flex flex-grow">
          <Route
            className="flex flex-grow"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn} to="/login">
                <Dash
                  userId={user && user.data ? user.data.id : null}
                  name={user && user.data ? user.data.name : null}
                  email={user && user.data ? user.data.email : null}
                />
              </PrivateRoute>
            }
            path="dash/:accountId/new-task"
          />
          <Route
            className="flex flex-grow"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn} to="/login">
                <Flow
                  userId={user && user.data ? user.data.id : null}
                  name={user && user.data ? user.data.name : null}
                  email={user && user.data ? user.data.email : null}
                />
              </PrivateRoute>
            }
            path="dash/:accountId/task/:flowId"
          />

          <Route
            className="flex flex-grow"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn} to="/login">
                <Settings
                  userId={user && user.data ? user.data.id : null}
                  name={user && user.data ? user.data.name : null}
                  email={user && user.data ? user.data.email : null}
                />
              </PrivateRoute>
            }
            path="dash/:accountId/settings"
          />
          <Route
            className="flex flex-grow"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn} to="/login">
                <Integrations
                  userId={user && user.data ? user.data.id : null}
                  name={user && user.data ? user.data.name : null}
                  email={user && user.data ? user.data.email : null}
                />
              </PrivateRoute>
            }
            path="dash/:accountId/integrations"
          />
          <Route
            className="flex flex-grow"
            element={
              <PrivateRoute isLoggedIn={isLoggedIn} to="/login">
                <AccountSelect
                  userId={user && user.data ? user.data.id : null}
                  name={user && user.data ? user.data.name : null}
                  email={user && user.data ? user.data.email : null}
                />
              </PrivateRoute>
            }
            path="/account-select"
          />

          <Route
            element={
              <PublicRoute isLoggedIn={isLoggedIn} to="/account-select">
                <Login />
              </PublicRoute>
            }
            path="/login"
          />
          <Route
            element={
              <PublicRoute isLoggedIn={isLoggedIn} to="/account-select">
                <Login />
              </PublicRoute>
            }
            path="/"
          />
          <Route element={<NotFound />} path="*" />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default Root;
