import { createReducer } from "@reduxjs/toolkit";

import { STATUS } from "literals";

import {
  getFlowsBefore,
  getFlowsBeforeSuccess,
  getFlowsBeforeFailure,
  getFlowsAfter,
  getFlowsAfterSuccess,
  getFlowsAfterFailure,
  getFlowMessagesBefore,
  getFlowMessagesBeforeSuccess,
  getFlowMessagesBeforeFailure,
  getFlowMessagesAfter,
  getFlowMessagesAfterSuccess,
  getFlowMessagesAfterFailure,
  getFlowDetails,
  getFlowDetailsSuccess,
  getFlowDetailsFailure,
  getFlowActiveRunStatus,
  getFlowActiveRunStatusSuccess,
  getFlowActiveRunStatusFailure,
  submitFlowRunUserInput,
  submitFlowRunUserInputSuccess,
  submitFlowRunUserInputFailure,
  submitFlowNodeUserInput,
  submitFlowNodeUserInputSuccess,
  submitFlowNodeUserInputFailure,
  resetState,
  addTempUserMessageToFlow,
  getFlowDataBefore,
  getFlowDataBeforeSuccess,
  getFlowDataBeforeFailure,
  getFlowDataAfter,
  getFlowDataAfterSuccess,
  getFlowDataAfterFailure,
  resetFlowMessages,
  archiveFlow,
  archiveFlowSuccess,
  archiveFlowFailure,
  getLLMCalls,
  getLLMCallsSuccess,
  getLLMCallsError,
  getDataTableDocuments,
  getDataTableDocumentsSuccess,
  getDataTableDocumentsError,
  getFlowRuns,
  getFlowRunsSuccess,
  getFlowRunsError,
  getFlowChart,
  getFlowChartSuccess,
  getFlowChartError,
} from "actions";

export const flowState = {
  flowList: {},
  flowDetailMap: {},
  flowMessagesMap: {},
  flowActiveRunStatusMap: {},
  flowDataMap: {},
  archiveFlowMap: {},
  dataTableDocumentsMap: {},
  llmCalls: {
    data: [],
    totalCount: 0,
    pageSize: 30,
    pageNumber: 1,
    totalPages: 0,
    loading: false,
    error: null,
  },
  runs: {},
  charts: {},
};

export default {
  flow: createReducer(flowState, (builder) => {
    builder.addCase(resetState, (draft) => {
      draft.flowList = {};
      draft.flowDetailMap = {};
      draft.flowMessagesMap = {};
      draft.flowActiveRunStatusMap = {};
    });

    const mergeAndSortFlows = (flows = [], newFlows = []) => {
      const mergedFlows = [
        ...flows.filter((flow) => !newFlows.map((f) => f.id).includes(flow.id)),
        ...newFlows,
      ];
      return mergedFlows.sort((a, b) => {
        // First sort by status - active first, inactive second
        if (a.status === 'active' && b.status === 'inactive') return -1;
        if (a.status === 'inactive' && b.status === 'active') return 1;
        
        // If status is same, sort by created_at descending
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    };

    const mergeAndSortFlowData = (flowData = [], newFlowData = []) => {
      const mergedFlowData = [
        ...flowData.filter(
          (data) => !newFlowData.map((d) => d.id).includes(data.id)
        ),
        ...newFlowData,
      ];
      return mergedFlowData.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    };

    const mergeAndSortMessages = (messages = [], newMessages = []) => {
      // Find any messages with toolCallId in newMessages
      const toolCallIds = newMessages
        .filter((m) => m.messages?.some((msg) => msg.metadata?.toolCallId))
        .flatMap((m) =>
          m.messages
            .filter((msg) => msg.metadata?.toolCallId)
            .map((msg) => msg.metadata.toolCallId)
        );

      // Filter out messages from current messages that have matching toolCallIds
      const filteredMessages = messages.filter(
        (message) =>
          !message.messages?.some(
            (msg) =>
              msg.metadata?.toolCallId &&
              toolCallIds.includes(msg.metadata.toolCallId)
          )
      );

      // Filter out duplicate IDs
      const mergedMessages = [
        ...filteredMessages.filter(
          (message) => !newMessages.map((m) => m.id).includes(message.id)
        ),
        ...newMessages,
      ];

      return mergedMessages.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    };

    builder
      .addCase(getFlowsBefore, (draft) => {
        draft.flowList.status = STATUS.RUNNING;
        draft.flowList.error = null;
      })
      .addCase(getFlowsBeforeSuccess, (draft, { payload }) => {
        draft.flowList.status = STATUS.SUCCESS;
        draft.flowList.data = mergeAndSortFlows(
          draft.flowList.data,
          payload.data.flows
        );
        if (payload.data.flows.length === 0) {
          draft.flowList.isEnd = true;
        }
      })
      .addCase(getFlowsBeforeFailure, (draft, { payload }) => {
        draft.flowList.status = STATUS.ERROR;
        draft.flowList.error = payload.error;
      });

    builder
      .addCase(getFlowsAfter, (draft) => {
        draft.flowList.status = STATUS.RUNNING;
        draft.flowList.error = null;
      })
      .addCase(getFlowsAfterSuccess, (draft, { payload }) => {
        draft.flowList.status = STATUS.SUCCESS;
        draft.flowList.data = mergeAndSortFlows(
          draft.flowList.data,
          payload.data.flows
        );
        draft.flowList.error = null;
      })
      .addCase(getFlowsAfterFailure, (draft, { payload }) => {
        draft.flowList.status = STATUS.ERROR;
        draft.flowList.error = payload.error;
      });

    builder.addCase(addTempUserMessageToFlow, (draft, { payload }) => {
      draft.flowMessagesMap[payload.flowId].data = mergeAndSortMessages(
        draft.flowMessagesMap[payload.flowId].data,
        [payload.messages]
      );
    });

    builder
      .addCase(getFlowMessagesBefore, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId] =
          draft.flowMessagesMap[payload.flowId] || {};
        draft.flowMessagesMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowMessagesMap[payload.flowId].error = null;
      })
      .addCase(getFlowMessagesBeforeSuccess, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowMessagesMap[payload.flowId].data = mergeAndSortMessages(
          draft.flowMessagesMap[payload.flowId].data,
          payload.messages
        );
        draft.flowMessagesMap[payload.flowId].isEnd = payload.isEnd;
        draft.flowMessagesMap[payload.flowId].error = null;
      })
      .addCase(getFlowMessagesBeforeFailure, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId].status = STATUS.ERROR;
        draft.flowMessagesMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(getFlowMessagesAfter, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowMessagesMap[payload.flowId].error = null;
      })
      .addCase(getFlowMessagesAfterSuccess, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowMessagesMap[payload.flowId].data = mergeAndSortMessages(
          draft.flowMessagesMap[payload.flowId].data,
          payload.messages
        );
      })
      .addCase(getFlowMessagesAfterFailure, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId].status = STATUS.ERROR;
        draft.flowMessagesMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(resetFlowMessages, (draft, { payload }) => {
        draft.flowMessagesMap[payload.flowId] = {};
      });

    builder
      .addCase(getFlowDetails, (draft, { payload }) => {
        draft.flowDetailMap[payload.flowId] =
          draft.flowDetailMap[payload.flowId] || {};
        draft.flowDetailMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowDetailMap[payload.flowId].error = null;
      })
      .addCase(getFlowDetailsSuccess, (draft, { payload }) => {
        draft.flowDetailMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowDetailMap[payload.flowId].data = {
          ...draft.flowDetailMap[payload.flowId].data,
          ...payload.data,
        };
        // if the data has generatedFlowId inside payload.data, then remove it from flowList
        if (payload.data.metadata.generatedFlowId) {
          draft.flowList.data = draft.flowList.data.filter(
            (flow) => flow.id !== payload.flowId
          );
        }
        draft.flowDetailMap[payload.flowId].error = null;
        // if the flow is present in flowList, update status, created_at, readable_name and readable_description
        const flowIndex = (draft.flowList.data || []).findIndex(
          (flow) => flow.id === payload.flowId
        );
        if (flowIndex !== -1) {
          draft.flowList.data[flowIndex] = {
            ...draft.flowList.data[flowIndex],
            status: payload.data.status,
            created_at: payload.data.created_at,
            readable_name: payload.data.readable_name,
            readable_description: payload.data.readable_description,
          };
        }
      })
      .addCase(getFlowDetailsFailure, (draft, { payload }) => {
        draft.flowDetailMap[payload.flowId].status = STATUS.ERROR;
        draft.flowDetailMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(getFlowActiveRunStatus, (draft, { payload }) => {
        draft.flowActiveRunStatusMap[payload.flowId] =
          draft.flowActiveRunStatusMap[payload.flowId] || {};
        draft.flowActiveRunStatusMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowActiveRunStatusMap[payload.flowId].error = null;
      })
      .addCase(getFlowActiveRunStatusSuccess, (draft, { payload }) => {
        draft.flowActiveRunStatusMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowActiveRunStatusMap[payload.flowId].data = {
          ...draft.flowActiveRunStatusMap[payload.flowId].data,
          ...payload.data,
        };
        draft.flowActiveRunStatusMap[payload.flowId].error = null;
      })
      .addCase(getFlowActiveRunStatusFailure, (draft, { payload }) => {
        draft.flowActiveRunStatusMap[payload.flowId].status = STATUS.ERROR;
        draft.flowActiveRunStatusMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(getFlowDataBefore, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId] =
          draft.flowDataMap[payload.flowId] || {};
        draft.flowDataMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowDataMap[payload.flowId].error = null;
      })
      .addCase(getFlowDataBeforeSuccess, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowDataMap[payload.flowId].data = mergeAndSortFlowData(
          draft.flowDataMap[payload.flowId].data,
          payload.data
        );
        draft.flowDataMap[payload.flowId].isEnd = payload.isEnd;
      })
      .addCase(getFlowDataBeforeFailure, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId].status = STATUS.ERROR;
        draft.flowDataMap[payload.flowId].error = payload.error;
      });

      builder
      .addCase(getFlowDataAfter, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId] =
          draft.flowDataMap[payload.flowId] || {};
        draft.flowDataMap[payload.flowId].status = STATUS.RUNNING;
        draft.flowDataMap[payload.flowId].error = null;
      })
      .addCase(getFlowDataAfterSuccess, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId].status = STATUS.SUCCESS;
        draft.flowDataMap[payload.flowId].data = mergeAndSortFlowData(
          draft.flowDataMap[payload.flowId].data,
          payload.data
        );
      })
      .addCase(getFlowDataAfterFailure, (draft, { payload }) => {
        draft.flowDataMap[payload.flowId].status = STATUS.ERROR;
        draft.flowDataMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(archiveFlow, (draft, { payload }) => {
        draft.archiveFlowMap[payload.flowId] =
          draft.archiveFlowMap[payload.flowId] || {};
        draft.archiveFlowMap[payload.flowId].status = STATUS.RUNNING;
        draft.archiveFlowMap[payload.flowId].error = null;
      })
      .addCase(archiveFlowSuccess, (draft, { payload }) => {
        draft.archiveFlowMap[payload.flowId].status = STATUS.SUCCESS;
        draft.archiveFlowMap[payload.flowId].error = null;
        // remove the flow from flowList
        draft.flowList.data = draft.flowList.data.filter(
          (flow) => flow.id !== payload.flowId
        );
        // update metadata of the flow in flowDetailMap
        draft.flowDetailMap[payload.flowId].data.metadata.archived = true;
      })
      .addCase(archiveFlowFailure, (draft, { payload }) => {
        draft.archiveFlowMap[payload.flowId].status = STATUS.ERROR;
        draft.archiveFlowMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(getLLMCalls, (draft) => {
        draft.llmCalls.loading = true;
        draft.llmCalls.error = null;
      })
      .addCase(getLLMCallsSuccess, (draft, { payload }) => {
        draft.llmCalls.data = payload.data.llmCalls;
        draft.llmCalls.totalCount = payload.data.totalCount;
        draft.llmCalls.pageSize = payload.data.pageSize;
        draft.llmCalls.pageNumber = payload.data.pageNumber;
        draft.llmCalls.totalPages = payload.data.totalPages;
        draft.llmCalls.loading = false;
      })
      .addCase(getLLMCallsError, (draft, { payload }) => {
        draft.llmCalls.loading = false;
        draft.llmCalls.error = payload.error;
      });

    builder
      .addCase(getDataTableDocuments, (draft, { payload }) => {
        draft.dataTableDocumentsMap[payload.flowId] =
          draft.dataTableDocumentsMap[payload.flowId] || {};
        draft.dataTableDocumentsMap[payload.flowId].status = STATUS.RUNNING;
        draft.dataTableDocumentsMap[payload.flowId].error = null;
      })
      .addCase(getDataTableDocumentsSuccess, (draft, { payload }) => {
        draft.dataTableDocumentsMap[payload.flowId].status = STATUS.SUCCESS;
        draft.dataTableDocumentsMap[payload.flowId].data = payload.data;
      })
      .addCase(getDataTableDocumentsError, (draft, { payload }) => {
        draft.dataTableDocumentsMap[payload.flowId].status = STATUS.ERROR;
        draft.dataTableDocumentsMap[payload.flowId].error = payload.error;
      });

    builder
      .addCase(getFlowRuns, (draft, { payload }) => {
        draft.runs[payload.flowId] = {
          ...draft.runs[payload.flowId],
          isLoading: true,
          error: null,
        };
      })
      .addCase(getFlowRunsSuccess, (draft, { payload }) => {
        draft.runs[payload.flowId] = {
          data: payload.data.runs,
          totalPages: payload.data.totalPages,
          totalCount: payload.data.totalCount,
          pageSize: payload.data.pageSize,
          pageNumber: payload.data.pageNumber,
          isLoading: false,
          error: null,
        };
      })
      .addCase(getFlowRunsError, (draft, { payload }) => {
        draft.runs[payload.flowId] = {
          ...draft.runs[payload.flowId],
          isLoading: false,
          error: payload.error,
        };
      });

    builder
      .addCase(getFlowChart, (draft, { payload }) => {
        draft.charts[payload.runId] = {
          isLoading: true,
          error: null,
        };
      })
      .addCase(getFlowChartSuccess, (draft, { payload }) => {
        draft.charts[payload.runId] = {
          nodes: payload.data.nodes,
          threads: payload.data.threads,
          isLoading: false,
          error: null,
        };
      })
      .addCase(getFlowChartError, (draft, { payload }) => {
        draft.charts[payload.runId] = {
          ...draft.charts[payload.runId],
          isLoading: false,
          error: payload.error,
        };
      });
  }),
};
