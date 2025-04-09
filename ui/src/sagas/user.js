import {
  all,
  delay,
  put,
  takeLatest,
  call,
  takeEvery,
} from "redux-saga/effects";

import toast from "react-hot-toast";

import { ActionTypes } from "literals";

import {
  getUserSuccess,
  getUserFailure,
  generateOtpSuccess,
  generateOtpFailure,
  verifyOtpSuccess,
  verifyOtpFailure,
  updateUserSuccess,
  updateUserFailure,
  resetState,
  getIntegrationsSuccess,
  getIntegrationsFailure,
  getAccountsOfUserSuccess,
  getAccountsOfUserFailure,
  getAccountOfUserSuccess,
  getAccountOfUserFailure,
  createAccountSuccess,
  createAccountFailure,
  getAccountUsersSuccess,
  getAccountUsersFailure,
  createAPIKeySuccess,
  createAPIKeyFailure,
  getAPIKeysSuccess,
  getAPIKeysFailure,
  deleteAPIKeySuccess,
  deleteAPIKeyFailure,
  updateAccountApiKeysSuccess,
  updateAccountApiKeysFailure,
} from "actions";

import axios from "axios";
const axiosInstance = axios.create({
  timeout: 20000,
  withCredentials: true,
});

import genFingerprint from "../fingerprint";

async function getFingerPrint() {
  return genFingerprint();
}

export function* getUserSaga() {
  const fingerprint = yield call(getFingerPrint);
  const timezoneOffsetInSeconds = new Date().getTimezoneOffset() * -60;

  try {
    const { data: res } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/details`,
        method: "POST",
        data: {
          fingerprint,
          timezoneOffsetInSeconds,
        },
      })
    );

    const { success, data, error } = res;

    if (success && data.user && data.isLoggedIn) {
      yield put(getUserSuccess(data.user));
    } else {
      yield put(getUserFailure({ error: error || "Something went wrong" }));

      if (!data.isLoggedIn) {
        // reset the state
        yield put(resetState());
        // if the user-details API fails, we need to clear the cookie
        // so that the user can login again
        document.cookie = `${
          process.env.REACT_APP_COOKIE_UUID_KEY || "browserable_uuid"
        }=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // update the user state fresh
        yield put(getUserFailure({ error: error || "Something went wrong" }));
      }
    }
  } catch (e) {
    yield put(getUserFailure({ error: e.message }));
  }
}

export function* getAccountsOfUser({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const timezoneOffsetInSeconds = new Date().getTimezoneOffset() * -60;

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/account/get/all`,
        method: "POST",
        data: {
          fingerprint,
          timezoneOffsetInSeconds,
        },
      })
    );

    const { success, error, accounts } = data;

    if (success) {
      yield put(
        getAccountsOfUserSuccess({
          accounts,
        })
      );
    } else {
      toast.error(`Error: ${error}`);
      yield put(
        getAccountsOfUserFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    toast.error(`Error: ${e.message}`);
    yield put(
      getAccountsOfUserFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* getAccountOfUser({ payload }) {
  const fingerprint = yield call(getFingerPrint);

  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/account/get`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
        },
      })
    );

    const { success, error, account } = data;

    if (success) {
      yield put(
        getAccountOfUserSuccess({
          account,
        })
      );
    } else {
      toast.error(`Error: ${error}`);
      // redirect to /
      window.location.href = "/";
      yield put(
        getAccountOfUserFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    // redirect to /
    window.location.href = "/";
    toast.error(`Error: ${e.message}`);
    yield put(
      getAccountOfUserFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* createAccount({ payload }) {
  const fingerprint = yield call(getFingerPrint);

  const { accountName, metadata } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/account/create`,
        method: "POST",
        data: {
          fingerprint,
          accountName,
          metadata,
        },
      })
    );

    const { success, error, accountId } = data;

    if (success) {
      // redirect the page to /<accountId>/dash
      window.location.href = `dash/${accountId}/new-task`;
    } else {
      toast.error(`Error: ${error}`);
      yield put(
        createAccountFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    toast.error(`Error: ${e.message}`);
    yield put(
      createAccountFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* getAccountUsers({ payload }) {
  const fingerprint = yield call(getFingerPrint);

  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/account/get/users`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
        },
      })
    );

    const { success, error, users } = data;

    if (success) {
      yield put(
        getAccountUsersSuccess({
          users,
          accountId,
        })
      );
    } else {
      toast.error(`Error: ${error}`);
      yield put(
        getAccountUsersFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    toast.error(`Error: ${e.message}`);
    yield put(
      getAccountUsersFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* generateOtp({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { email } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/otp/generate`,
        method: "POST",
        data: {
          email,
          fingerprint,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(generateOtpSuccess({ success, error }));
    } else {
      toast.error(`Error: ${error}`);
      yield put(generateOtpFailure({ error: error || "Something went wrong" }));
    }
  } catch (e) {
    toast.error(`Error: ${e.message}`);
    yield put(
      generateOtpFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* verifyOtp({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { email, otp, timezoneOffsetInSeconds } = payload || {};

  try {
    const { data: res } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/otp/validate`,
        method: "POST",
        data: {
          email,
          otp,
          fingerprint,
          timezoneOffsetInSeconds,
        },
      })
    );

    const { success, data, error } = res;

    const { route } = data || {};

    if (route === "waitlist_wait") {
      // redirect to www.browserable.com/waitlist?email=<email>
      window.location.href = `https://www.browserable.com/waitlist-wait?email=${email}`;
    }

    if (success && data.isValid) {
      // 200ms delay
      yield delay(200);

      // get user details
      yield call(getUserSaga);

      yield delay(200);

      yield put(verifyOtpSuccess());
    } else {
      yield put(verifyOtpFailure({ error: error || "Something went wrong" }));
    }
  } catch (e) {
    yield put(verifyOtpFailure({ error: e.message || "Something went wrong" }));
  }
}

export function* updateUser({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { name, slug, bio, pic, twitter, linkedin, instagram, settings } =
    payload || {};

  const toastId = toast.loading("Updating user details");

  try {
    const { data: res } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/update`,
        method: "POST",
        data: {
          fingerprint,
          name,
          slug,
          bio,
          pic,
          twitter,
          linkedin,
          instagram,
          settings,
        },
      })
    );

    const { success, error } = res;

    if (success) {
      yield put(updateUserSuccess());

      // call getUserSaga to update the user in the store
      yield call(getUserSaga);

      toast.success("Profile updated", {
        id: toastId,
      });
    } else {
      yield put(updateUserFailure({ error: error || "Something went wrong" }));

      toast.error(`Error: ${error}`, {
        id: toastId,
      });
    }
  } catch (e) {
    yield put(
      updateUserFailure({ error: e.message || "Something went wrong" })
    );

    toast.error(`Error: ${e.message}`, {
      id: toastId,
    });
  }
}

export function* getIntegrations({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data: res } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/integrations/base/get/paginated`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
        },
      })
    );

    const { success, data, error } = res;

    if (success) {
      yield put(getIntegrationsSuccess(data));
    } else {
      yield put(
        getIntegrationsFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    console.log(e);
    toast.error(`Error fetching integrations: ${e.message}`);
    yield put(
      getIntegrationsFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* createAPIKey({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId, name, metadata } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/api-keys/create`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          name,
          metadata,
        },
      })
    );

    const { success, error, apiKey } = data;

    if (success) {
      yield put(createAPIKeySuccess({ apiKey }));
      yield call(getAPIKeys, { payload: { accountId } });
    } else {
      yield put(
        createAPIKeyFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    yield put(
      createAPIKeyFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* getAPIKeys({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/api-keys/get`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
        },
      })
    );

    const { success, error, data: apiKeys } = data;

    if (success) {
      yield put(getAPIKeysSuccess({ apiKeys: apiKeys?.apiKeys || [] }));
    } else {
      yield put(getAPIKeysFailure({ error: error || "Something went wrong" }));
    }
  } catch (e) {
    yield put(
      getAPIKeysFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* deleteAPIKey({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId, apiKeyId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/api-keys/delete`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          apiKeyId,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(deleteAPIKeySuccess());
      yield call(getAPIKeys, { payload: { accountId } });
    } else {
      yield put(
        deleteAPIKeyFailure({ error: error || "Something went wrong" })
      );
    }
  } catch (e) {
    yield put(
      deleteAPIKeyFailure({ error: e.message || "Something went wrong" })
    );
  }
}

export function* logout({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/user/logout`,
        method: "POST",
        data: {
          fingerprint,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      // redirect to /
      window.location.href = "/";
    } else {
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    toast.error(`Error: ${e.message}`);
  }
}

export function* updateAccountApiKeys({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId, metadata } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/account/update/metadata`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          metadata,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(updateAccountApiKeysSuccess());
      toast.success("API keys updated");
    } else {
      yield put(updateAccountApiKeysFailure({ error: error || "Something went wrong" }));
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(updateAccountApiKeysFailure({ error: e.message || "Something went wrong" }));
    toast.error(`Error: ${e.message}`);
  }
}


export default function* root() {
  yield all([
    takeEvery(ActionTypes.GET_USER, getUserSaga),
    takeEvery(ActionTypes.GENERATE_OTP, generateOtp),
    takeEvery(ActionTypes.VERIFY_OTP, verifyOtp),
    takeEvery(ActionTypes.UPDATE_USER, updateUser),
    takeEvery(ActionTypes.GET_INTEGRATIONS, getIntegrations),
    takeEvery(ActionTypes.GET_ACCOUNTS_OF_USER, getAccountsOfUser),
    takeEvery(ActionTypes.GET_ACCOUNT_OF_USER, getAccountOfUser),
    takeEvery(ActionTypes.CREATE_ACCOUNT, createAccount),
    takeEvery(ActionTypes.GET_ACCOUNT_USERS, getAccountUsers),
    takeEvery(ActionTypes.CREATE_API_KEY, createAPIKey),
    takeEvery(ActionTypes.GET_API_KEYS, getAPIKeys),
    takeEvery(ActionTypes.DELETE_API_KEY, deleteAPIKey),
    takeEvery(ActionTypes.LOGOUT, logout),
    takeEvery(ActionTypes.UPDATE_ACCOUNT_API_KEYS, updateAccountApiKeys),
  ]);
}
