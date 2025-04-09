import { createAction } from "@reduxjs/toolkit";

import { ActionTypes } from "literals";

export const login = createAction(ActionTypes.USER_LOGIN_REQUEST);
export const loginSuccess = createAction(ActionTypes.USER_LOGIN_SUCCESS);

export const logOut = createAction(ActionTypes.USER_LOGOUT_REQUEST);
export const logOutSuccess = createAction(ActionTypes.USER_LOGOUT_SUCCESS);

export const getUser = createAction(ActionTypes.GET_USER);
export const getUserSuccess = createAction(
  ActionTypes.GET_USER_SUCCESS,
  (data) => ({
    payload: data,
  })
);
export const getUserFailure = createAction(
  ActionTypes.GET_USER_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const generateOtp = createAction(ActionTypes.GENERATE_OTP, (data) => ({
  payload: data,
}));
export const generateOtpSuccess = createAction(
  ActionTypes.GENERATE_OTP_SUCCESS,
  ({ success, error, data }) => ({ payload: { success, error, data } })
);
export const generateOtpFailure = createAction(
  ActionTypes.GENERATE_OTP_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const verifyOtp = createAction(
  ActionTypes.VERIFY_OTP,
  ({ email, otp, timezoneOffsetInSeconds } = {}) => ({
    payload: { email, otp, timezoneOffsetInSeconds },
  })
);
export const verifyOtpSuccess = createAction(
  ActionTypes.VERIFY_OTP_SUCCESS,
  (data) => ({
    payload: data,
  })
);
export const verifyOtpFailure = createAction(
  ActionTypes.VERIFY_OTP_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const updateUser = createAction(
  ActionTypes.UPDATE_USER,
  ({ name, slug, bio, pic, twitter, linkedin, instagram, settings } = {}) => ({
    payload: { name, slug, bio, pic, twitter, linkedin, instagram, settings },
  })
);
export const updateUserSuccess = createAction(
  ActionTypes.UPDATE_USER_SUCCESS,
  (data) => ({
    payload: data,
  })
);
export const updateUserFailure = createAction(
  ActionTypes.UPDATE_USER_FAILURE,
  (data) => ({
    payload: data,
  })
);
export const resetState = createAction(
  ActionTypes.RESET_USER_STATE,
  (data) => ({
    payload: data,
  })
);

export const getIntegrations = createAction(
  ActionTypes.GET_INTEGRATIONS,
  (data) => ({
    payload: data,
  })
);
export const getIntegrationsSuccess = createAction(
  ActionTypes.GET_INTEGRATIONS_SUCCESS,
  (data) => ({ payload: data })
);
export const getIntegrationsFailure = createAction(
  ActionTypes.GET_INTEGRATIONS_FAILURE,
  (data) => ({ payload: data })
);

export const getAccountsOfUser = createAction(
  ActionTypes.GET_ACCOUNTS_OF_USER,
  (data) => ({
    payload: data,
  })
);
export const getAccountsOfUserSuccess = createAction(
  ActionTypes.GET_ACCOUNTS_OF_USER_SUCCESS,
  (data) => ({ payload: data })
);
export const getAccountsOfUserFailure = createAction(
  ActionTypes.GET_ACCOUNTS_OF_USER_FAILURE,
  (data) => ({ payload: data })
);

export const getAccountOfUser = createAction(
  ActionTypes.GET_ACCOUNT_OF_USER,
  (data) => ({
    payload: data,
  })
);
export const getAccountOfUserSuccess = createAction(
  ActionTypes.GET_ACCOUNT_OF_USER_SUCCESS,
  (data) => ({ payload: data })
);
export const getAccountOfUserFailure = createAction(
  ActionTypes.GET_ACCOUNT_OF_USER_FAILURE,
  (data) => ({ payload: data })
);

export const createAccount = createAction(
  ActionTypes.CREATE_ACCOUNT,
  (data) => ({
    payload: data,
  })
);
export const createAccountSuccess = createAction(
  ActionTypes.CREATE_ACCOUNT_SUCCESS,
  (data) => ({ payload: data })
);
export const createAccountFailure = createAction(
  ActionTypes.CREATE_ACCOUNT_FAILURE,
  (data) => ({ payload: data })
);

export const getAccountUsers = createAction(
  ActionTypes.GET_ACCOUNT_USERS,
  (data) => ({
    payload: data,
  })
);
export const getAccountUsersSuccess = createAction(
  ActionTypes.GET_ACCOUNT_USERS_SUCCESS,
  (data) => ({ payload: data })
);
export const getAccountUsersFailure = createAction(
  ActionTypes.GET_ACCOUNT_USERS_FAILURE,
  (data) => ({ payload: data })
);

export const createAPIKey = createAction(
  ActionTypes.CREATE_API_KEY,
  (data) => ({ payload: data })
);
export const createAPIKeySuccess = createAction(
  ActionTypes.CREATE_API_KEY_SUCCESS,
  (data) => ({ payload: data })
);
export const createAPIKeyFailure = createAction(
  ActionTypes.CREATE_API_KEY_FAILURE,
  (data) => ({ payload: data })
);

export const getAPIKeys = createAction(
  ActionTypes.GET_API_KEYS,
  (data) => ({ payload: data })
);
export const getAPIKeysSuccess = createAction(
  ActionTypes.GET_API_KEYS_SUCCESS,
  (data) => ({ payload: data })
);
export const getAPIKeysFailure = createAction(
  ActionTypes.GET_API_KEYS_FAILURE,
  (data) => ({ payload: data })
);

export const deleteAPIKey = createAction(
  ActionTypes.DELETE_API_KEY,
  (data) => ({ payload: data })
);
export const deleteAPIKeySuccess = createAction(
  ActionTypes.DELETE_API_KEY_SUCCESS,
  (data) => ({ payload: data })
);
export const deleteAPIKeyFailure = createAction(
  ActionTypes.DELETE_API_KEY_FAILURE,
  (data) => ({ payload: data })
);

export const logout = createAction(ActionTypes.LOGOUT, (data) => ({
  payload: data,
}));

export const updateAccountApiKeys = createAction(
  ActionTypes.UPDATE_ACCOUNT_API_KEYS,
  (data) => ({ payload: data })
);
export const updateAccountApiKeysSuccess = createAction(
  ActionTypes.UPDATE_ACCOUNT_API_KEYS_SUCCESS,
  (data) => ({ payload: data })
);
export const updateAccountApiKeysFailure = createAction(
  ActionTypes.UPDATE_ACCOUNT_API_KEYS_FAILURE,
  (data) => ({ payload: data })
);
