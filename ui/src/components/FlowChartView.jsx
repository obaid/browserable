import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "modules/hooks";
import { getFlowRuns, getFlowChart } from "../actions/flow";
import { selectFlows, selectUser } from "../selectors";
import { readableDate } from "./utils";

function FlowChartView({ flowId }) {
  const dispatch = useDispatch();
  const userState = useAppSelector(selectUser);
  const flowState = useAppSelector(selectFlows);
  const { user, account } = userState;
  const accountId = account?.data?.id;
  const [pageSize] = useState(50);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const flowRuns = flowState.runs?.[flowId] || {
    data: [],
    pageNumber: 1,
    totalPages: 1,
    loading: false,
  };
  const selectedChart = flowState.charts?.[selectedRunId] || { loading: false };

  // Reset selectedRunId when flowId changes
  useEffect(() => {
    setSelectedRunId(null);
  }, [flowId]);

  // Auto-select first run when runs are loaded
  useEffect(() => {
    if (flowRuns.data?.length > 0 && !selectedRunId) {
      setSelectedRunId(flowRuns.data[0].id);
    }
  }, [flowRuns.data]);

  // Fetch chart data when selectedRunId changes
  useEffect(() => {
    if (selectedRunId) {
      dispatch(getFlowChart({ runId: selectedRunId, flowId, accountId }));
    }
  }, [selectedRunId, flowId, accountId]);

  useEffect(() => {
    dispatch(getFlowRuns({ flowId, pageSize, pageNumber: 1, accountId }));
  }, [flowId, pageSize, accountId]);

  const handleChartRefresh = () => {
    if (selectedRunId && !selectedChart?.loading) {
      dispatch(getFlowChart({ runId: selectedRunId, flowId, accountId }));
    }
  };

  const buildNodeTree = useCallback((nodes) => {
    // Find root node
    const root = nodes.find((node) => !node.parentNodeId);
    if (!root) return [];

    const buildTree = (currentNode) => {
      const children = nodes.filter(
        (node) => node.private_data.parentNodeId === currentNode.id
      );
      return {
        ...currentNode,
        children: children.map(buildTree),
      };
    };

    return buildTree(root);
  }, []);

  const renderNode = useCallback((node, level = 0) => {
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className="w-64 p-4 m-2 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium ">{node.agent_code}</div>
            <div className="text-xs px-2 py-0.5 bg-gray-100 rounded-full ">
              Level {node.private_data.threadLevel || 0}
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2 break-all whitespace-pre-wrap">
            {node.input}
          </div>
          <div
            className={`text-xs px-2 py-1 rounded-full inline-block
            ${
              node.status === "completed"
                ? "bg-green-100 text-green-800"
                : node.status === "running"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {node.status}
          </div>
        </div>

        {node.children?.length > 0 && (
          <>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="flex gap-4">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          </>
        )}
      </div>
    );
  }, []);

  const renderChart = () => {
    if (!selectedChart?.nodes?.length) {
      return null;
    }

    const nodeTree = buildNodeTree(selectedChart.nodes);
    return (
      <div className="overflow-x-auto overflow-y-auto h-full w-full min-h-0">
        <div className="min-w-max flex justify-center p-8">
          {renderNode(nodeTree)}
        </div>
      </div>
    );
  };

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

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {selectedRunId ? (
          <>
            {!selectedChart || selectedChart.loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin">
                  <i className="ri-loader-4-line text-2xl text-gray-400"></i>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col min-h-0">
                <div className="flex justify-end p-4">
                  <button
                    onClick={handleChartRefresh}
                    className="p-1  hover:text-gray-800"
                  >
                    <i
                      className={`ri-refresh-line block ${
                        selectedChart.loading ? "animate-spin" : ""
                      }`}
                    ></i>
                  </button>
                </div>
                {renderChart()}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-gray-500 text-center">
              No runs available for this flow.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowChartView;
