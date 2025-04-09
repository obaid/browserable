import { createAction } from "@reduxjs/toolkit";

import { ActionTypes } from "literals";


export const addTempUserMessageToFlow = createAction(
  ActionTypes.ADD_TEMP_USER_MESSAGE_TO_FLOW,
  (data) => ({
    payload: data,
  })
);

export const getFlowsBefore = createAction(
  ActionTypes.GET_FLOWS_BEFORE,
  (data) => ({
    payload: data,
  })
);
export const getFlowsBeforeSuccess = createAction(
  ActionTypes.GET_FLOWS_BEFORE_SUCCESS,
  (data) => ({
    payload: data,
  })
);
export const getFlowsBeforeFailure = createAction(
  ActionTypes.GET_FLOWS_BEFORE_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getFlowsAfter = createAction(
  ActionTypes.GET_FLOWS_AFTER,
  (data) => ({
    payload: data,
  })
);
export const getFlowsAfterSuccess = createAction(
  ActionTypes.GET_FLOWS_AFTER_SUCCESS,
  (data) => ({
    payload: data,
  })
);
export const getFlowsAfterFailure = createAction(
  ActionTypes.GET_FLOWS_AFTER_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesBefore = createAction(
  ActionTypes.GET_FLOW_MESSAGES_BEFORE,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesBeforeSuccess = createAction(
  ActionTypes.GET_FLOW_MESSAGES_BEFORE_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesBeforeFailure = createAction(
  ActionTypes.GET_FLOW_MESSAGES_BEFORE_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesAfter = createAction(
  ActionTypes.GET_FLOW_MESSAGES_AFTER,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesAfterSuccess = createAction(
  ActionTypes.GET_FLOW_MESSAGES_AFTER_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowMessagesAfterFailure = createAction(
  ActionTypes.GET_FLOW_MESSAGES_AFTER_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getFlowDetails = createAction(
  ActionTypes.GET_FLOW_DETAILS,
  (data) => ({
    payload: data,
  })
);

export const getFlowDetailsSuccess = createAction(
  ActionTypes.GET_FLOW_DETAILS_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowDetailsFailure = createAction(
  ActionTypes.GET_FLOW_DETAILS_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getFlowActiveRunStatus = createAction(
  ActionTypes.GET_FLOW_ACTIVE_RUN_STATUS,
  (data) => ({
    payload: data,
  })
);

export const getFlowActiveRunStatusSuccess = createAction(
  ActionTypes.GET_FLOW_ACTIVE_RUN_STATUS_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowActiveRunStatusFailure = createAction(
  ActionTypes.GET_FLOW_ACTIVE_RUN_STATUS_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const submitFlowRunUserInput = createAction(
  ActionTypes.SUBMIT_FLOW_RUN_USER_INPUT,
  (data) => ({
    payload: data,
  })
);

export const submitFlowRunUserInputSuccess = createAction(
  ActionTypes.SUBMIT_FLOW_RUN_USER_INPUT_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const submitFlowRunUserInputFailure = createAction(
  ActionTypes.SUBMIT_FLOW_RUN_USER_INPUT_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const submitFlowNodeUserInput = createAction(
  ActionTypes.SUBMIT_FLOW_NODE_USER_INPUT,
  (data) => ({
    payload: data,
  })
);

export const submitFlowNodeUserInputSuccess = createAction(
  ActionTypes.SUBMIT_FLOW_NODE_USER_INPUT_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const submitFlowNodeUserInputFailure = createAction(
  ActionTypes.SUBMIT_FLOW_NODE_USER_INPUT_FAILURE,
  (data) => ({
    payload: data,
  })
);


export const getFlowDataBefore = createAction(
  ActionTypes.GET_FLOW_DATA_BEFORE,
  (data) => ({
    payload: data,
  })
);

export const getFlowDataBeforeSuccess = createAction(
  ActionTypes.GET_FLOW_DATA_BEFORE_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowDataBeforeFailure = createAction(
  ActionTypes.GET_FLOW_DATA_BEFORE_FAILURE,
  (data) => ({
    payload: data,
  })
);


export const getFlowDataAfter = createAction(
  ActionTypes.GET_FLOW_DATA_AFTER,
  (data) => ({
    payload: data,
  })
);

export const getFlowDataAfterSuccess = createAction(
  ActionTypes.GET_FLOW_DATA_AFTER_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowDataAfterFailure = createAction(
  ActionTypes.GET_FLOW_DATA_AFTER_FAILURE,
  (data) => ({
    payload: data,
  })
);


export const resetFlowMessages = createAction(
  ActionTypes.RESET_FLOW_MESSAGES,
  (data) => ({
    payload: data,
  })
);

export const archiveFlow = createAction(
  ActionTypes.ARCHIVE_FLOW,
  (data) => ({
    payload: data,
  })
);

export const archiveFlowSuccess = createAction(
  ActionTypes.ARCHIVE_FLOW_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const archiveFlowFailure = createAction(
  ActionTypes.ARCHIVE_FLOW_FAILURE,
  (data) => ({
    payload: data,
  })
);

export const getLLMCalls = createAction(
  ActionTypes.GET_LLM_CALLS,
  (data) => ({
    payload: data,
  })
);

export const getLLMCallsSuccess = createAction(
  ActionTypes.GET_LLM_CALLS_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getLLMCallsError = createAction(
  ActionTypes.GET_LLM_CALLS_ERROR,
  (data) => ({
    payload: data,
  })
);

export const getDataTableDocuments = createAction(
  ActionTypes.GET_DATA_TABLE_DOCUMENTS,
  (data) => ({
    payload: data,
  })
);

export const getDataTableDocumentsSuccess = createAction(
  ActionTypes.GET_DATA_TABLE_DOCUMENTS_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getDataTableDocumentsError = createAction(
  ActionTypes.GET_DATA_TABLE_DOCUMENTS_ERROR,
  (data) => ({
    payload: data,
  })
);

export const getFlowRuns = createAction(
  ActionTypes.GET_FLOW_RUNS,
  (data) => ({
    payload: data,
  })
);

export const getFlowRunsSuccess = createAction(
  ActionTypes.GET_FLOW_RUNS_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowRunsError = createAction(
  ActionTypes.GET_FLOW_RUNS_ERROR,
  (data) => ({
    payload: data,
  })
);

export const getFlowChart = createAction(
  ActionTypes.GET_FLOW_CHART,
  (data) => ({
    payload: data,
  })
);

export const getFlowChartSuccess = createAction(
  ActionTypes.GET_FLOW_CHART_SUCCESS,
  (data) => ({
    payload: data,
  })
);

export const getFlowChartError = createAction(
  ActionTypes.GET_FLOW_CHART_ERROR,
  (data) => ({
    payload: data,
  })
);