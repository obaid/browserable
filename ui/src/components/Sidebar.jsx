import React, { useEffect, useState, useRef } from "react";
import useCookie from "../hooks/useCookie";
import {
  selectNotes,
  selectNoteActions,
  selectFlows,
  selectUser,
} from "../selectors";
import { useAppSelector } from "modules/hooks";
import useInterval from "beautiful-react-hooks/useInterval";
import { useDispatch } from "react-redux";
import { STATUS } from "../literals";
import {
  useNavigate,
  useLocation,
  useSearchParams,
  useParams,
} from "react-router-dom";
import {
  getFlowsBefore,
  getFlowsAfter,
  getAccountUsers,
  getAccountOfUser,
} from "../actions";

function Sidebar(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const flows = useAppSelector(selectFlows);
  const location = useLocation();
  const { flowId, accountId } = useParams();
  const isLoading = flows?.flowList?.status === STATUS.RUNNING;
  const scrollRef = useRef(null);
  const userState = useAppSelector(selectUser);
  const { user } = userState;

  useEffect(() => {
    if (!flows.flowList.status || flows.flowList.status === STATUS.ERROR) {
      dispatch(
        getFlowsBefore({
          accountId,
          before: Date.now(),
          limit: 30,
          offset: 0,
        })
      );
    }

    dispatch(getAccountUsers({ accountId }));
    dispatch(getAccountOfUser({ accountId }));
  }, [accountId]);

  useInterval(() => {
    const flowData = flows.flowList.data || [];
    if (flowData.length === 0) {
      dispatch(
        getFlowsBefore({
          accountId,
          before: Date.now(),
          limit: 50,
          offset: 0,
        })
      );
    } else {
      const latestFlow = Math.max(
        ...flowData.map((flow) => new Date(flow.created_at).getTime())
      );
      dispatch(getFlowsAfter({ accountId, after: latestFlow }));
    }
  }, 10000);

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (
      bottom &&
      !isLoading &&
      flows.flowList.data?.length > 0 &&
      !flows.flowList.isEnd
    ) {
      const oldestFlow = Math.min(
        ...flows.flowList.data.map((flow) =>
          new Date(flow.created_at).getTime()
        )
      );
      dispatch(
        getFlowsBefore({
          accountId,
          before: oldestFlow,
          limit: 50,
          offset: 0,
        })
      );
    }
  };

  const isSettings = location.pathname === `/dash/${accountId}/settings`;
  const isIntegrations =
    location.pathname === `/dash/${accountId}/integrations`;
  const getStartedPage = location.pathname === `/dash/${accountId}/new-task`;

  return (
    <div className="flex flex-grow flex-col max-h-screen h-full">
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        <div className="h-6 mx-4 mt-4 mb-4">
          <img
            src={"/browserable-ai.png"}
            alt="user"
            className="h-full object-contain"
          />
        </div>

        <div
          className="flex-grow overflow-y-auto px-4"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="mt-4">
            <div
              onClick={() => navigate(`/dash/${accountId}/new-task`)}
              className={`flex text-sm items-center gap-2 rounded-md px-1 py-0.5 cursor-pointer ${
                getStartedPage ? "bg-blue-100 font-black" : "font-semibold"
              }`}
            >
              <i className="ri-add-box-line"></i>
              <span>New Task</span>
            </div>
          </div>

          {flows.flowList.data?.length > 0 && (
            <div className="mt-8">
              <span className="text-base font-black">Tasks</span>
            </div>
          )}
          <div className="">
            {(((flows || {}).flowList || {}).data || []).map((flow) => {
              return (
                <div key={flow.id}>
                  <div
                    className={`text-sm cursor-pointer hover:bg-blue-100 rounded-md overflow-hidden whitespace-nowrap text-ellipsis px-1 py-1 ${
                      flowId === flow.id
                        ? "bg-blue-100 font-black"
                        : "font-semibold"
                    }`}
                    onClick={() =>
                      navigate(`/dash/${accountId}/task/${flow.id}`)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`ri-circle-fill ri-xxs ${
                          flow.status === "active" ? "text-green-500" : ""
                        }`}
                      ></i>
                      <span className="truncate">{flow.readable_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* {isLoading && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )} */}
        </div>

        <div className="flex-shrink flex flex-col space-y-1 py-4">
          {!Number(process.env.REACT_APP_SINGLE_USER_MODE) && (
            <div className="mx-4">
              <div
                onClick={() => navigate(`/dash/${accountId}/integrations`)}
                className={`flex items-center text-sm gap-2 rounded-md px-1 py-0.5 cursor-pointer  ${
                  isIntegrations ? "bg-blue-100 font-black" : "font-medium"
                }`}
              >
                <i className="ri-puzzle-line"></i>
                <span>Integrations</span>
              </div>
            </div>
          )}
          <div className=" mx-4">
            <div
              onClick={() => navigate(`/dash/${accountId}/settings`)}
              className={`flex items-center text-sm gap-2 rounded-md px-1 py-0.5 cursor-pointer  ${
                isSettings ? "bg-blue-100 font-black" : "font-medium"
              }`}
            >
              <i className="ri-settings-2-line"></i>
              <span>{Number(process.env.REACT_APP_SINGLE_USER_MODE) ? "API Keys" : "Settings"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
