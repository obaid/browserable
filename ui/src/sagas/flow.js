import {
  all,
  delay,
  put,
  takeLatest,
  call,
  takeEvery,
  select,
} from "redux-saga/effects";

import toast from "react-hot-toast";

import { ActionTypes } from "literals";

import {
  getFlowsBeforeSuccess,
  getFlowsBeforeFailure,
  getFlowsAfterSuccess,
  getFlowsAfterFailure,
  getFlowMessagesBeforeSuccess,
  getFlowMessagesBeforeFailure,
  getFlowMessagesAfterSuccess,
  getFlowMessagesAfterFailure,
  getFlowDetailsSuccess,
  getFlowDetailsFailure,
  getFlowActiveRunStatusSuccess,
  getFlowActiveRunStatusFailure,
  getFlowDataBeforeSuccess,
  getFlowDataBeforeFailure,
  getFlowDataAfterSuccess,
  getFlowDataAfterFailure,
  archiveFlowSuccess,
  archiveFlowFailure,
  getLLMCallsSuccess,
  getLLMCallsError,
  getDataTableDocumentsSuccess,
  getDataTableDocumentsError,
  getFlowRunsSuccess,
  getFlowRunsError,
  getFlowChartSuccess,
  getFlowChartError,
} from "actions";

import axios from "axios";
const axiosInstance = axios.create({
  timeout: 20000,
  withCredentials: true,
});

import genFingerprint from "../fingerprint";

// import FingerprintJS from '@fingerprintjs/fingerprintjs';

async function getFingerPrint() {
  return genFingerprint();
  // const fp = await FingerprintJS.load();

  // const { visitorId } = await fp.get();

  // return visitorId;
}

function* getFlowsBefore({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const {
      data: { success, data: dataFromServer, error },
    } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flows/before`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    if (success) {
      yield put(
        getFlowsBeforeSuccess({
          data: dataFromServer,
        })
      );
    } else {
      yield put(
        getFlowsBeforeFailure({ error: error || "Something went wrong" })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(
      getFlowsBeforeFailure({ error: e.message || "Something went wrong" })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowsAfter({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flows/after`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowsAfterSuccess({
          data: data.data,
        })
      );
    } else {
      yield put(
        getFlowsAfterFailure({ error: error || "Something went wrong" })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowsAfter", e);
    yield put(
      getFlowsAfterFailure({ error: e.message || "Something went wrong" })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowMessagesBefore({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/messages/before`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowMessagesBeforeSuccess({
          accountId,
          messages: data.data.messages,
          flowId: payload.flowId,
          isEnd: data.data.messages.length === 0,
        })
      );
    } else {
      yield put(
        getFlowMessagesBeforeFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(
      getFlowMessagesBeforeFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowMessagesAfter({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/messages/after`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowMessagesAfterSuccess({
          accountId,
          messages: data.data.messages,
          flowId: payload.flowId,
        })
      );
    } else {
      yield put(
        getFlowMessagesAfterFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(
      getFlowMessagesAfterFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowDetails({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/details`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowDetailsSuccess({
          accountId,
          flowId: payload.flowId,
          data: data.data,
        })
      );
    } else {
      yield put(
        getFlowDetailsFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(
      getFlowDetailsFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowActiveRunStatus({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/active-run-status`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowActiveRunStatusSuccess({
          accountId,
          flowId: payload.flowId,
          data: data.data,
        })
      );
    } else {
      yield put(
        getFlowActiveRunStatusFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowActiveRunStatus", e);
    yield put(
      getFlowActiveRunStatusFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowDataBefore({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/data/before`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowDataBeforeSuccess({
          accountId,
          flowId: payload.flowId,
          data: data.data.runs,
          isEnd: data.data.runs.length === 0,
        })
      );
    } else {
      yield put(
        getFlowDataBeforeFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowDataBefore", e);
    yield put(
      getFlowDataBeforeFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowDataAfter({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/data/after`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(
        getFlowDataAfterSuccess({
          accountId,
          flowId: payload.flowId,
          data: data.data.runs,
        })
      );
    } else {
      yield put(
        getFlowDataAfterFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowDataAfter", e);
    yield put(
      getFlowDataAfterFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* archiveFlow({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { accountId } = payload || {};

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/archive/flow`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          ...payload,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(archiveFlowSuccess({ accountId, flowId: payload.flowId }));
      toast.success("Task archived successfully");
    } else {
      yield put(
        archiveFlowFailure({
          accountId,
          error: error || "Something went wrong",
          flowId: payload.flowId,
        })
      );
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    yield put(
      archiveFlowFailure({
        accountId,
        error: e.message || "Something went wrong",
        flowId: payload.flowId,
      })
    );
    toast.error(`Error: ${e.message}`);
  }
}

function* getDataTableDocumentsSaga({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { flowId, pageSize, pageNumber, accountId } = payload;

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/data-table`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          flowId,
          pageSize,
          pageNumber,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(getDataTableDocumentsSuccess({
          data: data.data,
          pageSize,
          pageNumber,
          schema: data.data.schema || [],
          totalPages: data.data.totalPages,
          totalCount: data.data.totalCount,
          flowId,
          accountId,
      }));
    } else {
      yield put(getDataTableDocumentsError({
        error: error || "Something went wrong",
        flowId,
        accountId,
      }));
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getDataTableDocumentsSaga", e);
    yield put(getDataTableDocumentsError({
      error: e.message || "Something went wrong",
      flowId,
      accountId,
    }));
    toast.error(`Error: ${e.message}`);
  }
}

function* getLLMCallsSaga({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { flowId, pageSize, pageNumber, accountId } = payload;

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/llm-calls`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          flowId,
          pageSize,
          pageNumber,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(getLLMCallsSuccess({
          data: data.data,
          pageSize,
          pageNumber,
          totalPages: data.data.totalPages,
          totalCount: data.data.totalCount,
      }));
    } else {
      yield put(getLLMCallsError(error || "Something went wrong"));
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getLLMCallsSaga", e);
    yield put(getLLMCallsError(e.message || "Something went wrong"));
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowRunsSaga({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { flowId, pageSize, pageNumber, sortOrder, accountId } = payload;

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/runs`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          flowId,
          pageSize,
          pageNumber,
          sortOrder,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(getFlowRunsSuccess({
        flowId,
        data: data.data,
      }));
    } else {
      yield put(getFlowRunsError({
        flowId,
        error: error || "Something went wrong",
      }));
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowRunsSaga", e);
    yield put(getFlowRunsError({
      flowId,
      error: e.message || "Something went wrong",
    }));
    toast.error(`Error: ${e.message}`);
  }
}

function* getFlowChartSaga({ payload }) {
  const fingerprint = yield call(getFingerPrint);
  const { runId, flowId, accountId } = payload;

  try {
    const { data } = yield call(() =>
      axiosInstance.request({
        url: `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/get/flow/chart`,
        method: "POST",
        data: {
          fingerprint,
          accountId,
          runId,
          flowId,
        },
      })
    );

    const { success, error } = data;

    if (success) {
      yield put(getFlowChartSuccess({
        runId,
        data: data.data,
      }));
    } else {
      yield put(getFlowChartError({
        runId,
        error: error || "Something went wrong",
      }));
      toast.error(`Error: ${error}`);
    }
  } catch (e) {
    console.log("Error in getFlowChartSaga", e);
    yield put(getFlowChartError({
      runId, 
      error: e.message || "Something went wrong",
    }));
    toast.error(`Error: ${e.message}`);
  }
}

export default function* root() {
  yield all([
    takeEvery(ActionTypes.GET_FLOWS_BEFORE, getFlowsBefore),
    takeEvery(ActionTypes.GET_FLOWS_AFTER, getFlowsAfter),
    takeEvery(ActionTypes.GET_FLOW_MESSAGES_BEFORE, getFlowMessagesBefore),
    takeEvery(ActionTypes.GET_FLOW_MESSAGES_AFTER, getFlowMessagesAfter),
    takeEvery(ActionTypes.GET_FLOW_DETAILS, getFlowDetails),
    takeEvery(ActionTypes.GET_FLOW_ACTIVE_RUN_STATUS, getFlowActiveRunStatus),
    takeEvery(ActionTypes.GET_FLOW_DATA_BEFORE, getFlowDataBefore),
    takeEvery(ActionTypes.GET_FLOW_DATA_AFTER, getFlowDataAfter),
    takeEvery(ActionTypes.ARCHIVE_FLOW, archiveFlow),
    takeEvery(ActionTypes.GET_LLM_CALLS, getLLMCallsSaga),
    takeEvery(ActionTypes.GET_DATA_TABLE_DOCUMENTS, getDataTableDocumentsSaga),
    takeEvery(ActionTypes.GET_FLOW_RUNS, getFlowRunsSaga),
    takeEvery(ActionTypes.GET_FLOW_CHART, getFlowChartSaga),
  ]);
}
