import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "modules/hooks";
import { getFlowRuns } from "../actions/flow";
import { selectFlows, selectUser } from "../selectors";

function GifView({ flowId }) {
  const dispatch = useDispatch();
  const userState = useAppSelector(selectUser);
  const flowState = useAppSelector(selectFlows);
  const { account } = userState;
  const accountId = account?.data?.id;
  const [pageSize] = useState(50);
  const flowRuns = flowState.runs?.[flowId] || {
    data: [],
    pageNumber: 1,
    totalPages: 1,
    loading: false,
  };

  useEffect(() => {
    dispatch(getFlowRuns({ flowId, pageSize, pageNumber: 1, accountId }));
  }, [flowId, pageSize, accountId]);

  // Show loader while fetching initial runs
  if (flowRuns.loading && !flowRuns.data?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin">
          <i className="ri-loader-4-line text-2xl text-gray-400"></i>
        </div>
      </div>
    );
  }

  const firstRun = flowRuns.data?.[0];
  const gifUrl = firstRun?.private_data?.gifUrl;

  return (
    <div className="flex h-full items-center justify-center p-8">
      {gifUrl ? (
        <img src={gifUrl} alt="Flow GIF" className="max-w-full max-h-full border-2 border-gray-300 rounded-md" />
      ) : (
        <div className="text-gray-500">GIF not available</div>
      )}
    </div>
  );
}

export default GifView; 