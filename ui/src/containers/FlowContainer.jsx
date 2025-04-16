import React, { useEffect, useState, useRef } from "react";
import useCookie from "../hooks/useCookie";
import { selectFlows, selectUser } from "../selectors";
import { STATUS } from "../literals";
import PresentData from "../components/PresentData";
import TextareaAutosize from "react-textarea-autosize";
import { useAppSelector } from "modules/hooks";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AppWrapper from "./AppWraper";
import TextLoader from "../components/TextLoader";
import toast from "react-hot-toast";
import useTreeChanges from "tree-changes-hook";
import { motion } from "motion/react";
import axios from "axios";
import {
  getFlowActiveRunStatus,
  getFlowMessagesAfter,
  getFlowMessagesBefore,
  getFlowDataAfter,
  getFlowDataBefore,
  getFlowDetails,
  addTempUserMessageToFlow,
  getFlowDetailsSuccess,
  resetFlowMessages,
  archiveFlow,
} from "../actions";
import LLMCallsView from '../components/LLMCallsView';
import DataTableView from '../components/DataTableView';
import ProjectView from '../components/ProjectView';
import FlowChartView from '../components/FlowChartView';
import ReportView from '../components/ReportView';

const axiosInstance = axios.create({
  timeout: 50000,
  withCredentials: true,
});
import genFingerprint from "../fingerprint";

function getAssociateDataHelper(data) {
  const [collapsed, setCollapsed] = useState(false);
  const { type, markdown, code, url, name } = data;
  // collapsed > <Name> format. if clicked. the triagnle icon changes to down arrow. and the content is shown.
  return (
    <div className="text-sm">
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-blue-500"
        onClick={() => setCollapsed(!collapsed)}
      >
        <button>
          {!collapsed ? (
            <i className="ri-arrow-right-s-line"></i>
          ) : (
            <i className="ri-arrow-down-s-line"></i>
          )}
        </button>
        <span>{name}</span>
        {/* {an icon to show what type of data it is } */}
        {type === "markdown" ? (
          <i className="ri-markdown-line"></i>
        ) : type === "code" ? (
          <i className="ri-code-line"></i>
        ) : type === "image" ? (
          <i className="ri-image-line"></i>
        ) : null}
      </div>
      {collapsed ? (
        <div className="ml-4 rounded-md bg-gray-100 border-2  border-transparent">
          {markdown ? (
            <div className="px-6">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          ) : url ? (
            <div>
              <img className="my-0" src={url} />
            </div>
          ) : code ? (
            <div>
              <code className="white-space-pre-wrap">
                {JSON.stringify(code, null, 2)}
              </code>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getAssociatedData(content) {
  if (content.associatedData) {
    return content.associatedData.map((data) => {
      return getAssociateDataHelper(data);
    });
  }
}

function Message(props) {
  const { content } = props;

  if (typeof content === "string") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  } else if (Array.isArray(content)) {
    return content.map((c, j) => <Message content={c} />);
  } else if (typeof content === "object") {
    if (content.type === "image" && content.url) {
      return (
        <div>
          <img src={content.url} />
          {getAssociatedData(content)}
        </div>
      );
    } else if (content.text) {
      return (
        <div>
          <span className="whitespace-pre-wrap">{content.text}</span>
          {getAssociatedData(content)}
        </div>
      );
    } else if (content.type === "markdown") {
      return (
        <div>
          <ReactMarkdown>{content.markdown}</ReactMarkdown>
          {getAssociatedData(content)}
        </div>
      );
    } else if (content.type === "code") {
      return (
        <div>
          <code>{content.code}</code>
          {getAssociatedData(content)}
        </div>
      );
    } else if (content.type === "url") {
      return (
        <div>
          <img src={content.url} />
          {getAssociatedData(content)}
        </div>
      );
    }
  }
}

function Flow(props) {
  const navigate = useNavigate();
  const [token, setToken] = useCookie(
    process.env.REACT_APP_COOKIE_UUID_KEY || "browserable_uuid",
    ""
  );
  const dispatch = useDispatch();
  const { flowId } = useParams();
  const flows = useAppSelector(selectFlows);
  const userState = useAppSelector(selectUser);
  const { user, account } = userState;
  const accountId = account?.data?.id;
  const flowMessages = flows.flowMessagesMap[flowId] || {};
  const isFetching = flowMessages.status === STATUS.RUNNING;
  const messagesContainerRef = useRef(null);
  const activeRunStatus = flows.flowActiveRunStatusMap[flowId] || {};
  const isFetchingActiveRunStatus = activeRunStatus.status === STATUS.RUNNING;
  const isFetchingFlowDetails =
    flows.flowDetailMap[flowId]?.status === STATUS.RUNNING;
  const flowDetails = flows.flowDetailMap[flowId] || {};
  const { changed } = useTreeChanges(flowDetails);
  const creatorStatus = flowDetails.data?.metadata?.creatorStatus;
  const flowStatus = (flows.flowActiveRunStatusMap[flowId] || {}).data
    ?.runStatus || creatorStatus;
  const flowSuperStatus = flows.flowDetailMap[flowId]?.data?.status;
  const isActive =
    flowStatus && flowStatus != "completed" && flowStatus != "error";
  const showThinking = flowStatus !== "ask_user_for_input" || creatorStatus;
  const [userInput, setUserInput] = useState("");
  const userInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevFlowStatusRef = useRef(flowStatus);
  const flowData = flows.flowDataMap[flowId] || {};
  const isFetchingFlowData = flowData.status === STATUS.RUNNING;
  const [isStopping, setIsStopping] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const prevMessagesRef = useRef(null);
  const archiveFlowStatus = flows.archiveFlowMap[flowId] || {};
  const isArchiving = archiveFlowStatus.status === STATUS.RUNNING;
  const showArchiveButton = flowSuperStatus === "inactive";
  const flowArchived = flowDetails.data?.metadata?.archived;
  const { changed: changedArchived } = useTreeChanges(
    flowDetails.data?.metadata || {}
  );
  const [activeTab, setActiveTab] = useState("project");
  const isAdmin = user?.data?.isAdmin;

  // monitor flow archived. if it wasn't before and if it is now, navigate to the task page
  useEffect(() => {
    if (flowArchived) {
      navigate(`/dash/${accountId}/new-task`);
    }
  }, [flowArchived, changedArchived, accountId]);

  useEffect(() => {
    if (changed) {
      if (flowDetails.data?.metadata?.generatedFlowId) {
        navigate(
          `/dash/${accountId}/task/${flowDetails.data.metadata.generatedFlowId}`
        );
      }
    }
  }, [changed, flowDetails, accountId]);

  useEffect(() => {
    if (accountId) {
      dispatch(
        getFlowMessagesBefore({
          accountId,
          before: Date.now(),
          limit: 20,
          offset: 0,
          flowId,
          segment: isAdmin ? "agent" : "user",
        })
      );

      dispatch(
        getFlowActiveRunStatus({
          accountId,
          flowId,
        })
      );

      dispatch(
        getFlowDataBefore({
          accountId,
          flowId,
          before: Date.now(),
          limit: 20,
          offset: 0,
        })
      );

      dispatch(
        getFlowDetails({
          accountId,
          flowId,
        })
      );
    }
  }, [flowId, accountId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (accountId) {
      const pollInterval = setInterval(async () => {
        if (isActive || flowSuperStatus === "active") {
          if (!isFetching) {
            // Get messages
            const messages = flowMessages.data || [];
            if (messages.length > 0) {
              const maxCreatedAt = Math.max(
                ...messages.map((msg) => new Date(msg.created_at).getTime())
              );
              dispatch(
                getFlowMessagesAfter({
                  accountId,
                  after: maxCreatedAt,
                  limit: 20,
                  flowId,
                  segment: isAdmin ? "agent" : "user",
                })
              );
            } else {
              dispatch(
                getFlowMessagesBefore({
                  accountId,
                  before: Date.now(),
                  limit: 20,
                  offset: 0,
                  flowId,
                  segment: isAdmin ? "agent" : "user",
                })
              );
            }
          }

          if (!isFetchingFlowData) {
            const maxCreatedAt = Math.max(
              ...flowData.data.map((data) => new Date(data["Date"]).getTime())
            );
            dispatch(
              getFlowDataAfter({
                accountId,
                flowId,
                after: maxCreatedAt,
                limit: 20,
                offset: 0,
              })
            );
          }

          if (!isFetchingActiveRunStatus) {
            dispatch(
              getFlowActiveRunStatus({
                accountId,
                flowId,
              })
            );
          }

          if (!isFetchingFlowDetails) {
            dispatch(
              getFlowDetails({
                accountId,
                flowId,
              })
            );
          }
        }
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [flowId, flowMessages, isFetching, isActive, flowSuperStatus, accountId]);

  // Add new effect to handle flow completion
  useEffect(() => {
    if (accountId) {
      if (
        (flowStatus === "completed" || flowStatus === "error") &&
        prevFlowStatusRef.current !== flowStatus
      ) {
        const messages = flowMessages.data || [];
        if (messages.length > 0) {
          const maxCreatedAt = Math.max(
            ...messages.map((msg) => new Date(msg.created_at).getTime())
          );
          dispatch(
            getFlowMessagesAfter({
              accountId,
              after: maxCreatedAt,
              limit: 20,
              flowId,
              segment: isAdmin ? "agent" : "user",
            })
          );
        }

        if (!isFetchingFlowData) {
          const maxCreatedAt = Math.max(
            ...flowData.data.map((data) => new Date(data.created_at).getTime())
          );
          dispatch(
            getFlowDataAfter({
              accountId,
              flowId,
              after: maxCreatedAt,
              limit: 20,
              offset: 0,
            })
          );
        }
      }
      prevFlowStatusRef.current = flowStatus;
    }
  }, [flowStatus, flowMessages, flowId, accountId]);

  // Auto-scroll to bottom when new messages arrive at the end
  useEffect(() => {
    if (accountId) {
      if (flowMessages.data && flowMessages.data.length > 0) {
        const currentMessages = flowMessages.data;
        const prevMessages = prevMessagesRef.current;

        if (prevMessages && currentMessages.length > prevMessages.length) {
          const prevLatestTime = Math.max(
            ...prevMessages.map((msg) => new Date(msg.created_at).getTime())
          );
          const currentLatestTime = Math.max(
            ...currentMessages.map((msg) => new Date(msg.created_at).getTime())
          );

          // If new message was added at the end
          if (currentLatestTime > prevLatestTime) {
            messagesContainerRef.current?.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }

        prevMessagesRef.current = currentMessages;
      }
    }
  }, [flowMessages.data, accountId]);

  // Handle scroll to top
  const handleScroll = (e) => {
    if (accountId) {
      const { scrollTop } = e.target;
      if (scrollTop === 0 && !isFetching && !flowMessages.isEnd) {
        const messages = flowMessages.data || [];
        if (messages.length > 0) {
          const minCreatedAt = Math.min(
            ...messages.map((msg) => new Date(msg.created_at).getTime())
          );
          dispatch(
            getFlowMessagesBefore({
              accountId,
              before: minCreatedAt,
              limit: 20,
              flowId,
              segment: isAdmin ? "agent" : "user",
            })
          );
        }
      }
    }
  };

  const handleUserInputChange = (e) => {
    // only accept the input if the flow is in the ask_user_for_input state
    if (flowStatus === "ask_user_for_input") {
      setUserInput(e.target.value);
    }
  };

  const handleStopFlow = async () => {
    if (flowSuperStatus === "active") {
      setIsStopping(true);

      const fingerprint = await genFingerprint();
      // stop for 10 seconds
      const { data: res } = await axiosInstance.request(
        `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/update/flow/status`,
        {
          method: "POST",
          data: {
            fingerprint,
            flowId,
            accountId,
            status: "inactive",
          },
        }
      );

      const { success, data, error } = res;

      if (success) {
        toast.success("Task stopped successfully");
      } else {
        toast.error(error);
      }

      if (data && data.flow) {
        dispatch(
          getFlowDetailsSuccess({
            accountId,
            flowId,
            data: data.flow,
          })
        );
      }

      setIsStopping(false);
    }
  };

  // const handleFormatResult = async () => {
  //   if (flowSuperStatus === "inactive") {
  //     setIsFormatting(true);

  //     const fingerprint = await genFingerprint();
  //     const { data: res } = await axiosInstance.request(
  //       `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/recreate/structured-output`,
  //       {
  //         method: "POST",
  //         data: {
  //           accountId,
  //           fingerprint,
  //           flowId,
  //         },
  //       }
  //     );

  //     const { success, error } = res;

  //     if (success) {
  //       toast.success("Result formatted successfully");
  //     } else {
  //       toast.error(error);
  //     }

  //     // refresh the flow details
  //     dispatch(
  //       getFlowDataBefore({
  //         accountId,
  //         flowId,
  //         before: Date.now(),
  //         limit: 20,
  //         offset: 0,
  //       })
  //     );

  //     setIsFormatting(false);
  //   }
  // };

  const showSubmitButton =
    flowStatus === "ask_user_for_input" &&
    activeRunStatus.data &&
    activeRunStatus.data.inputWait;

  const handleSubmitUserInput = async () => {
    if (showSubmitButton) {
      const { inputWaitId, runId, nodeId } = activeRunStatus.data.inputWait;

      if (inputWaitId) {
        setIsSubmitting(true);
        setUserInput("");

        dispatch(
          addTempUserMessageToFlow({
            accountId,
            flowId,
            messages: {
              messages: [
                {
                  role: "user",
                  content: userInput,
                  metadata: {
                    inputWaitId,
                  },
                },
              ],
              id: Date.now(),
              created_at: new Date().toISOString(),
            },
          })
        );

        const fingerprint = await genFingerprint();
        await axiosInstance.request(
          `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/submit/flow/${
            nodeId ? "node" : "run"
          }/user-input`,
          {
            method: "POST",
            data: {
              accountId,
              fingerprint,
              node_id: nodeId,
              run_id: runId,
              inputWaitId,
              messages: [
                {
                  role: "user",
                  content: userInput,
                  metadata: {
                    inputWaitId,
                  },
                },
              ],
            },
          }
        );

        setIsSubmitting(false);
      }
    }
  };

  const cleanFlowData = (data) => {
    if (data) {
      let cleanedData = JSON.parse(JSON.stringify(data));
      // remove the created_at field
      delete cleanedData.created_at;

      // if data is an array, remove the created_at field from each object
      if (Array.isArray(cleanedData)) {
        cleanedData.forEach((item) => {
          delete item.created_at;
        });
      }

      return cleanedData;
    }
  };

  const getReport = (data) => {
    if (Array.isArray(data) && data.length == 1 && data[0].REPORT) {
      return {
        type: "markdown",
        markdown: data[0].REPORT,
      };
    }

    if (typeof data === "object" && data !== null && data.REPORT) {
      return {
        type: "markdown",
        markdown: data.REPORT,
      };
    }

    return null;
  };

  const projectTab = (
    <ProjectView
      flowDetails={flowDetails}
      activeRunStatus={activeRunStatus}
      flowData={flowData}
      flowStatus={flowStatus}
      showThinking={showThinking}
      userInput={userInput}
      setUserInput={setUserInput}
      userInputRef={userInputRef}
      isSubmitting={isSubmitting}
      handleSubmitUserInput={handleSubmitUserInput}
      showSubmitButton={showSubmitButton}
      isActive={isActive}
      flowMessages={flowMessages}
      messagesContainerRef={messagesContainerRef}
      handleScroll={handleScroll}
      flowSuperStatus={flowSuperStatus}
      showArchiveButton={showArchiveButton}
      isArchiving={isArchiving}
      isStopping={isStopping}
      handleStopFlow={handleStopFlow}
      handleArchiveFlow={() => dispatch(archiveFlow({ flowId, accountId }))}
    />
  );

  console.log("flowDetails", flowDetails);

  const llmtab = <LLMCallsView flowId={flowId} />;
  const dataTableTab = <DataTableView flowId={flowId} />;
  const flowChartTab = <FlowChartView flowId={flowId} />;
  const reportTab = <ReportView flowId={flowId} />;

  const isDeepResearchAgent = flowDetails?.data?.metadata?.agent_codes?.includes("DEEPRESEARCH_AGENT");

  const tabs = isAdmin
    ? [
        {
          id: "project",
          label: "Task",
          component: projectTab,
        },
        {
          id: "llm-calls",
          label: "LLM Calls",
          component: llmtab,
        },
        {
          id: "flow-chart",
          label: "Flow Chart",
          component: flowChartTab,
        },
        {
          id: "results-table",
          label: "Results Table",
          component: dataTableTab,
        },
        ...(isDeepResearchAgent ? [{
          id: "report",
          label: "Report",
          component: reportTab,
        }] : []),
      ]
    : [
        {
          id: "project",
          label: "Project",
          component: projectTab,
        },
        {
          id: "results-table",
          label: "Results Table",
          component: dataTableTab,
        },
        ...(isDeepResearchAgent ? [{
          id: "report",
          label: "Report",
          component: reportTab,
        }] : []),
      ];

  if (token) {
    return (
      <AppWrapper {...props}>
        {token && props.userId ? (
          <div className="flex flex-grow flex-col max-h-screen">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 space-x-1 px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`py-2 font-medium text-sm`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={`text-sm px-3 py-1 rounded ${activeTab === tab.id ? 'text-black bg-gray-100 font-black' : 'text-gray-500 font-medium'}`}>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        ) : null}
      </AppWrapper>
    );
  }

  return null;
}

export default Flow;
