import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "modules/hooks";
import { getDataTableDocuments } from "../actions/flow";
import { selectFlows, selectUser } from "../selectors";
import ReactMarkdown from "react-markdown";
import { STATUS } from "../literals";

function ReportView({ flowId }) {
  const dispatch = useDispatch();
  const flowState = useAppSelector(selectFlows);
  const userState = useAppSelector(selectUser);
  const dataTableDocuments = flowState.dataTableDocumentsMap[flowId] || {};
  const { data = {}, status } = dataTableDocuments;
  const { documents = [] } = data || {};
  const { user, account } = userState;
  const accountId = account?.data?.id;
  const isLoading = status === STATUS.RUNNING;
  const flowDetails = flowState.flowDetailMap[flowId] || {};
  const flowStatus = flowDetails.data?.metadata?.creatorStatus;
  const isActive = flowStatus && flowStatus !== "completed" && flowStatus !== "error";

  useEffect(() => {
    dispatch(
      getDataTableDocuments({ 
        flowId, 
        pageSize: 1, 
        pageNumber: 1, 
        accountId 
      })
    );
  }, [flowId, accountId]);

  if (isLoading || isActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Waiting for task to finish running.</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No report available</p>
      </div>
    );
  }

  const { report, sources } = documents[0];

  return (
    <div className="p-4 overflow-y-auto">
      <div className="prose-sm prose max-w-none">
        <ReactMarkdown>{report}</ReactMarkdown>
        <hr className="my-8" />
        <h2>Sources</h2>
        <ReactMarkdown>{sources}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ReportView; 