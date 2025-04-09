import { createReducer } from "@reduxjs/toolkit";

import { STATUS } from "literals";

import {
  login,
  loginSuccess,
  logOut,
  logOutSuccess,
  getUser,
  getUserSuccess,
  getUserFailure,
  generateOtp,
  generateOtpSuccess,
  generateOtpFailure,
  verifyOtp,
  verifyOtpSuccess,
  verifyOtpFailure,
  updateUser,
  updateUserSuccess,
  updateUserFailure,
  resetState,
  getIntegrations,
  getIntegrationsSuccess,
  getIntegrationsFailure,
  getAccountsOfUser,
  getAccountsOfUserSuccess,
  getAccountsOfUserFailure,
  getAccountOfUser,
  getAccountOfUserSuccess,
  getAccountOfUserFailure,
  createAccount,
  createAccountSuccess,
  createAccountFailure,
  getAccountUsers,
  getAccountUsersSuccess,
  getAccountUsersFailure,
  createAPIKey,
  createAPIKeySuccess,
  createAPIKeyFailure,
  getAPIKeys,
  getAPIKeysSuccess,
  getAPIKeysFailure,
  deleteAPIKey,
  deleteAPIKeySuccess,
  deleteAPIKeyFailure,
  updateAccountApiKeys,
  updateAccountApiKeysSuccess,
  updateAccountApiKeysFailure,
} from "actions";

export const userState = {
  user: {
    status: STATUS.IDLE,
    data: null,
    error: null,
    isLoggedIn: false,
    isFirstTime: true,
  },
  accounts: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
  account: {
    status: STATUS.IDLE,
    data: null,
    error: null,
    users: {
      status: STATUS.IDLE,
      data: null,
      error: null,
    },
    apiKeys: {
      status: STATUS.IDLE,
      data: null,
      error: null,
    },
  },
  createAccount: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
  integrations: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
  updateAccountApiKeys: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
};

export const otpState = {
  otp: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
  verifyOtp: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
  addCustomDomain: {
    status: STATUS.IDLE,
    data: null,
    error: null,
  },
};

export default {
  user: createReducer(userState, (builder) => {
    builder.addCase(resetState, (draft) => {
      draft.user = userState.user;
    });

    builder
      .addCase(getUser, (draft) => {
        draft.user.status = STATUS.RUNNING;
        draft.user.error = null;
      })
      .addCase(getUserSuccess, (draft, { payload }) => {
        draft.user.status = STATUS.SUCCESS;
        draft.user.data = payload;
        draft.user.isLoggedIn = true;
        draft.user.isFirstTime = false;
      })
      .addCase(getUserFailure, (draft, { payload }) => {
        draft.user.status = STATUS.ERROR;
        draft.user.error = payload;
        draft.user.isLoggedIn = false;
        draft.user.isFirstTime = false;
      });

    builder
      .addCase(getAccountsOfUser, (draft) => {
        draft.accounts.status = STATUS.RUNNING;
        draft.accounts.error = null;
      })
      .addCase(getAccountsOfUserSuccess, (draft, { payload }) => {
        draft.accounts.status = STATUS.SUCCESS;
        draft.accounts.data = payload.accounts;
      })
      .addCase(getAccountsOfUserFailure, (draft, { payload }) => {
        draft.accounts.status = STATUS.ERROR;
        draft.accounts.error = payload.error;
      });

    builder
      .addCase(getAccountOfUser, (draft) => {
        draft.account.status = STATUS.RUNNING;
        draft.account.error = null;
      })
      .addCase(getAccountOfUserSuccess, (draft, { payload }) => {
        draft.account.status = STATUS.SUCCESS;
        draft.account.data = payload.account;
      })
      .addCase(getAccountOfUserFailure, (draft, { payload }) => {
        draft.account.status = STATUS.ERROR;
        draft.account.error = payload.error;
      });

    builder
      .addCase(getAccountUsers, (draft) => {
        draft.account.users.status = STATUS.RUNNING;
        draft.account.users.error = null;
      })
      .addCase(getAccountUsersSuccess, (draft, { payload }) => {
        draft.account.users.status = STATUS.SUCCESS;
        draft.account.users.data = payload.users;
        if (
          draft.user.status === STATUS.SUCCESS &&
          draft.user.data &&
          payload.users &&
          payload.users?.find(
            (user) =>
              user.user_id === draft.user.data.id && user.role === "admin"
          )
        ) {
          draft.user.data.isAdmin = true;
        }
      })
      .addCase(getAccountUsersFailure, (draft, { payload }) => {
        draft.account.users.status = STATUS.ERROR;
        draft.account.users.error = payload.error;
      });

    builder
      .addCase(createAPIKey, (draft) => {
        draft.account.apiKeys.createStatus = STATUS.RUNNING;
        draft.account.apiKeys.createError = null;
      })
      .addCase(createAPIKeySuccess, (draft, { payload }) => {
        draft.account.apiKeys.createStatus = STATUS.SUCCESS;
      })
      .addCase(createAPIKeyFailure, (draft, { payload }) => {
        draft.account.apiKeys.createStatus = STATUS.ERROR;
        draft.account.apiKeys.createError = payload.error;
      });

    builder
      .addCase(getAPIKeys, (draft) => {
        draft.account.apiKeys.status = STATUS.RUNNING;
        draft.account.apiKeys.error = null;
      })
      .addCase(getAPIKeysSuccess, (draft, { payload }) => {
        draft.account.apiKeys.status = STATUS.SUCCESS;
        draft.account.apiKeys.data = payload.apiKeys;
      })
      .addCase(getAPIKeysFailure, (draft, { payload }) => {
        draft.account.apiKeys.status = STATUS.ERROR;
        draft.account.apiKeys.error = payload.error;
      });
    
    builder
      .addCase(deleteAPIKey, (draft) => {
        draft.account.apiKeys.deleteStatus = STATUS.RUNNING;
        draft.account.apiKeys.deleteError = null;
      })
      .addCase(deleteAPIKeySuccess, (draft, { payload }) => {
        draft.account.apiKeys.deleteStatus = STATUS.SUCCESS;
      })
      .addCase(deleteAPIKeyFailure, (draft, { payload }) => {
        draft.account.apiKeys.deleteStatus = STATUS.ERROR;
        draft.account.apiKeys.deleteError = payload.error;
      });

    builder
      .addCase(createAccount, (draft) => {
        draft.createAccount.status = STATUS.RUNNING;
        draft.createAccount.error = null;
      })
      .addCase(createAccountSuccess, (draft, { payload }) => {
        draft.createAccount.status = STATUS.SUCCESS;
      })
      .addCase(createAccountFailure, (draft, { payload }) => {
        draft.createAccount.status = STATUS.ERROR;
        draft.createAccount.error = payload.error;
      });

    builder
      .addCase(updateUser, (draft) => {
        draft.user.status = STATUS.RUNNING;
        draft.user.error = null;
      })
      .addCase(updateUserSuccess, (draft, { payload }) => {
        draft.user.status = STATUS.SUCCESS;
      })
      .addCase(updateUserFailure, (draft, { payload }) => {
        draft.user.status = STATUS.ERROR;
        draft.user.error = payload.error;
      });


    builder
      .addCase(getIntegrations, (draft) => {
        draft.integrations.status = STATUS.RUNNING;
        draft.integrations.error = null;
      })
      .addCase(getIntegrationsSuccess, (draft, { payload }) => {
        draft.integrations.status = STATUS.SUCCESS;
        draft.integrations.data = payload;
      })
      .addCase(getIntegrationsFailure, (draft, { payload }) => {
        draft.integrations.status = STATUS.ERROR;
        draft.integrations.error = payload.error;
      });

    builder
      .addCase(updateAccountApiKeys, (draft) => {
        draft.account.apiKeys.updateStatus = STATUS.RUNNING;
        draft.account.apiKeys.updateError = null;
      })
      .addCase(updateAccountApiKeysSuccess, (draft, { payload }) => {
        draft.account.apiKeys.updateStatus = STATUS.SUCCESS;
      })
      .addCase(updateAccountApiKeysFailure, (draft, { payload }) => {
        draft.account.apiKeys.updateStatus = STATUS.ERROR;
        draft.account.apiKeys.updateError = payload.error;
      });
  }),

  otp: createReducer(otpState, (builder) => {
    builder.addCase(resetState, (draft) => {
      return otpState;
    });

    builder
      .addCase(generateOtp, (draft) => {
        draft.otp.status = STATUS.RUNNING;
        draft.otp.error = null;
      })
      .addCase(generateOtpSuccess, (draft, { payload }) => {
        draft.otp.status = STATUS.SUCCESS;
      })
      .addCase(generateOtpFailure, (draft, { payload }) => {
        draft.otp.status = STATUS.ERROR;
        draft.otp.error = payload.error;
      });

    builder
      .addCase(verifyOtp, (draft) => {
        draft.verifyOtp.status = STATUS.RUNNING;
        draft.verifyOtp.error = null;
      })
      .addCase(verifyOtpSuccess, (draft, { payload }) => {
        draft.verifyOtp.status = STATUS.SUCCESS;
        draft.verifyOtp.error = null;
      })
      .addCase(verifyOtpFailure, (draft, { payload }) => {
        draft.verifyOtp.status = STATUS.ERROR;
        draft.verifyOtp.error = payload.error;
      });
  }),
};
