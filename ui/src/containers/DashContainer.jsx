import React, { useEffect, useState, useRef } from "react";
import useCookie from "../hooks/useCookie";
import { selectNotes, selectNoteActions } from "../selectors";
import { useAppSelector } from "modules/hooks";
import useInterval from "beautiful-react-hooks/useInterval";
import { useDispatch } from "react-redux";
import { STATUS } from "../literals";
import { useNavigate, useParams } from "react-router-dom";
import AppWrapper from "./AppWraper";
import { motion } from "motion/react";
import useTreeChanges from "tree-changes-hook";
import toast from "react-hot-toast";
import { getIntegrations } from "../actions";
import TextareaAutosize from "react-textarea-autosize";
import axios from "axios";
const axiosInstance = axios.create({
  timeout: 50000,
  withCredentials: true,
});
import { selectUser } from "../selectors";
import genFingerprint from "../fingerprint";

function Dash(props) {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const [token, setToken] = useCookie(
    process.env.REACT_APP_COOKIE_UUID_KEY || "browserable_uuid",
    ""
  );
  // const { changed: notesStateChanged } = useTreeChanges(notesState);
  const dispatch = useDispatch();

  const [story, setStory] = useState("");
  const textareaRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const userState = useAppSelector(selectUser);
  const { user, integrations, account } = userState;

  let [agents, setAgents] = useState([]);
  let [localBrowserServiceStatus, setLocalBrowserServiceStatus] =
    useState("unknown");

  useEffect(() => {
    const fn = async () => {
      try {
        const response = await axios.get(
          process.env.REACT_APP_LOCAL_BROWSER_SERVICE_URL + "/health"
        );
        setLocalBrowserServiceStatus(response.data.status);
      } catch (error) {
        setLocalBrowserServiceStatus("unknown");
      }
    };
    fn();
  }, []);

  const [sampleTasks] = useState([
    {
      id: 1,
      task: "Find the top trending GitHub repos of the day",
    },
    {
      id: 2,
      task: "Find a Coursera course that teaches Python to beginners",
    },
    {
      id: 3,
      task: "Tell me the names of Trump's kids",
    },
  ]);

  useEffect(() => {
    setAgents(
      (integrations.data || []).map((integration) => ({
        code: integration.code,
        label: integration.name,
        status: integration.meta.enabled ? "enabled" : "disabled",
      }))
    );
  }, [integrations]);

  useEffect(() => {
    dispatch(getIntegrations({ accountId }));
  }, [accountId]);

  const handleCreateTask = async () => {
    // Check if API keys are missing
    if (showApiKeysBanner || showBrowserApiKeysBanner) {
      toast.error("Please set up your API keys before creating a task");
      return;
    }

    setIsSubmitting(true);
    const fingerprint = await genFingerprint();

    const response = await axiosInstance.request(
      `${process.env.REACT_APP_TASKS_PUBLIC_URL}/flow/create/generator`,
      {
        method: "POST",
        data: {
          accountId,
          fingerprint,
          initMessage: story,
          agent: selectedNonGenerativeAgent,
          tools: [
            {
              type: "function",
              function: {
                name: "form_input",
                description: `Use this tool to ask information from the user. This is the only way to get information from the user. And assume that user might not have any other immediate context. So any relevant/ related information user needs can be provided to the user using this.
When to use this:
- If you are stuck and you need help from user
- Captchas that you are not able to solve yourself
- Logins, Signups etc.
Rules:
- Only ask information that you need from a human who doesn't understand your system like tab ids etc.`,
                parameters: {
                  type: "object",
                  properties: {
                    heading: {
                      type: "string",
                      description: "The heading of the form input",
                    },
                    description: {
                      type: "string",
                      description: "The description of the form input",
                    },
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            description:
                              "What type of input to show to the user",
                            enum: [
                              "text",
                              "number",
                              "email",
                              "tel",
                              "url",
                              "password",
                              "date",
                              "time",
                              "datetime-local",
                              "month",
                              "week",
                              "textarea",
                              "select",
                              "checkbox",
                              "radio",
                              "switch",
                              "range",
                            ],
                          },
                          label: {
                            type: "string",
                            description: "Label text for the input field",
                          },
                          placeholder: {
                            type: "string",
                            description:
                              "Placeholder text shown when field is empty",
                          },
                          defaultValue: {
                            type: ["string", "number", "boolean"],
                            description: "Default value for the field",
                          },
                          readonly: {
                            type: "boolean",
                            description: "Whether the field is read-only",
                            default: false,
                          },
                          required: {
                            type: "boolean",
                            description: "Whether the field is required",
                            default: false,
                          },
                          disabled: {
                            type: "boolean",
                            description: "Whether the field is disabled",
                            default: false,
                          },
                          min: {
                            type: "number",
                            description:
                              "Minimum value for number/range/date inputs",
                          },
                          max: {
                            type: "number",
                            description:
                              "Maximum value for number/range/date inputs",
                          },
                          step: {
                            type: "number",
                            description: "Step value for number/range inputs",
                          },
                          minLength: {
                            type: "number",
                            description: "Minimum length for text inputs",
                          },
                          maxLength: {
                            type: "number",
                            description: "Maximum length for text inputs",
                          },
                          pattern: {
                            type: "string",
                            description:
                              "Regular expression pattern for validation",
                          },
                          options: {
                            type: "array",
                            description:
                              "Options for select/radio/checkbox inputs",
                            items: {
                              type: "object",
                              properties: {
                                label: {
                                  type: "string",
                                  description: "Display label for the option",
                                },
                                value: {
                                  type: ["string", "number"],
                                  description: "Value for the option",
                                },
                              },
                            },
                          },
                          multiple: {
                            type: "boolean",
                            description:
                              "Allow multiple selections for select input",
                            default: false,
                          },
                          rows: {
                            type: "number",
                            description: "Number of rows for textarea",
                          },
                          cols: {
                            type: "number",
                            description: "Number of columns for textarea",
                          },
                          autocomplete: {
                            type: "string",
                            description: "Autocomplete attribute value",
                          },
                          className: {
                            type: "string",
                            description:
                              "CSS class names to apply to the input",
                          },
                        },
                        required: ["type"],
                      },
                    },
                    submitButton: {
                      type: "object",
                      properties: {
                        label: {
                          type: "string",
                          description: "Label text for the submit button",
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      }
    );

    setIsSubmitting(false);
    if (response.data.success) {
      // reset the story
      setStory("");
      navigate(`/dash/${accountId}/task/${response.data.data.flowId}`);
    } else {
      toast.error(response.data.error);
    }
  };

  const nonGenerativeAiAgents = agents.filter(
    (agent) => !agent.code.includes("GENERATIVE_AGENT")
  );

  const [selectedNonGenerativeAgent, setSelectedNonGenerativeAgent] =
    useState("BROWSER_AGENT");

  // Check if API keys are missing in single user mode
  const accountDataFetched = !!account.data;
  const metadata = account.data?.metadata || {};
  const {
    userApiKeys,
    systemApiKeys,
    userBrowserApiKeys,
    systemBrowserApiKeys,
  } = metadata;
  const systemApiKeysMissing =
    accountDataFetched &&
    Object.keys(systemApiKeys || {}).filter((key) => systemApiKeys[key])
      .length === 0;
  const userApiKeysMissing =
    accountDataFetched &&
    (!userApiKeys ||
      Object.keys(userApiKeys || {}).filter((key) => userApiKeys[key])
        .length === 0);
  const systemBrowserApiKeysMissing =
    accountDataFetched &&
    Object.keys(systemBrowserApiKeys || {}).filter(
      (key) => systemBrowserApiKeys[key]
    ).length === 0;
  const userBrowserApiKeysMissing =
    accountDataFetched &&
    (!userBrowserApiKeys ||
      Object.keys(userBrowserApiKeys || {}).filter(
        (key) => userBrowserApiKeys[key]
      ).length === 0);
  const showApiKeysBanner =
    !!Number(process.env.REACT_APP_SINGLE_USER_MODE) &&
    accountDataFetched &&
    systemApiKeysMissing &&
    userApiKeysMissing;
  const showBrowserApiKeysBanner =
    !!Number(process.env.REACT_APP_SINGLE_USER_MODE) &&
    accountDataFetched &&
    systemBrowserApiKeysMissing &&
    userBrowserApiKeysMissing &&
    localBrowserServiceStatus !== "ok";

  if (token) {
    return (
      <AppWrapper {...props}>
        {token && props.userId ? (
          <div className="flex flex-grow flex-col max-h-screen">
            <div className="flex flex-col justify-center items-center h-full overflow-hidden">
              <div className="w-full p-4 flex flex-col justify-center items-center">
                {showApiKeysBanner && (
                  <div className="w-full flex flex-col lg:flex-row max-w-xl mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="ri-error-warning-line text-yellow-600"></i>
                      <span className="text-sm text-yellow-800">
                        Please set up your API keys to start using the
                        application
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/dash/${accountId}/settings`)}
                      className="text-sm ml-auto bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded-md transition-colors duration-150"
                    >
                      Set up keys
                    </button>
                  </div>
                )}
                {showBrowserApiKeysBanner && (
                  <div className="w-full flex flex-col max-w-xl mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex gap-2 mb-2 items-start">
                      <i className="ri-error-warning-line text-yellow-600"></i>
                      <span className="text-sm text-yellow-800">
                        Please start local browser (follow the guide{" "}
                        <a
                          href="https://docs.browserable.ai/development/local-development#start-the-local-browser-service"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          here
                        </a>
                        ) OR set up your remote browser API keys (Steel/
                        Hyperbrowser) to start using the application.
                      </span>
                    </div>
                    <div className="flex w-full gap-2">
                      <div className="flex-1"></div>
                      <button
                        onClick={() => {
                          window.open(
                            "https://docs.browserable.ai/development/local-development",
                            "_blank"
                          );
                        }}
                        className="text-sm shrink-0 bg-gray-800 hover:bg-gray-900 text-white px-3 py-0.5 rounded-md transition-colors duration-150"
                      >
                        Set up local browser
                      </button>
                      <button
                        onClick={() => navigate(`/dash/${accountId}/settings`)}
                        className="text-sm shrink-0 bg-gray-800 hover:bg-gray-900 text-white px-3 py-0.5 rounded-md transition-colors duration-150"
                      >
                        Set up keys
                      </button>
                    </div>
                  </div>
                )}
                <h1 className="text-2xl font-black mb-4 tracking-tight">
                  What can I do for you?
                </h1>
                <div className="w-full max-w-xl bg-gray-100 rounded-xl p-2 ring-0">
                  {nonGenerativeAiAgents.length > 0 && (
                    <div className="w-full flex flex-wrap gap-3 mb-2">
                      {nonGenerativeAiAgents.map((agent) => {
                        // Skip DEEPRESEARCH_AGENT if local browser is available
                        if (agent.code === "DEEPRESEARCH_AGENT" && localBrowserServiceStatus === "ok") {
                          return null;
                        }
                        return (
                          <div
                            key={agent.code}
                            className="flex font-semibold items-center gap-1 cursor-pointer hover:bg-gray-200 px-2 py-0.5 rounded-md transition-colors duration-150"
                            onClick={() => {
                              setSelectedNonGenerativeAgent(agent.code);
                            }}
                          >
                            <i
                              className={` ${
                                selectedNonGenerativeAgent === agent.code
                                  ? "text-black ri-checkbox-circle-fill"
                                  : "text-gray-500 ri-checkbox-blank-circle-line"
                              }`}
                            ></i>
                            <span className="text-sm">{agent.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <TextareaAutosize
                    className="w-full text-sm border-transparent focus:border-transparent focus:ring-0 focus:ring-offset-0 border-none outline-none focus:outline-none bg-transparent resize-none p-2 ring-0"
                    placeholder="Describe your task here."
                    value={story}
                    minRows={5}
                    maxRows={14}
                    onChange={(e) => setStory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateTask();
                      }
                    }}
                    ref={textareaRef}
                  />
                  <div className="w-full flex cursor-pointer justify-end items-center gap-2">
                    <motion.div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateTask();
                      }}
                      className={`leading-none bg-gray-800 text-sm cursor-pointe hover:bg-gray-900 text-white px-2 py-1.5 rounded-md flex items-center justify-center gap-0`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        width: isSubmitting ? 140 : 160,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                        width: {
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        },
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="ri-loader-2-line animate-spin"></i>
                          <span className="ml-2">Creating</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-corner-down-left-line"></i>
                          <span className="ml-2">Create task</span>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>
                <div className="w-full max-w-xl mt-8">
                  <p className="text-sm text-gray-600 mb-2 font-bold">
                    Or try one of these sample tasks:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sampleTasks.map((sample) => (
                      <motion.button
                        key={sample.id}
                        onClick={() => setStory(sample.task)}
                        style={{ border: "1px solid #D1D5DB" }}
                        className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors duration-150 text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {sample.task}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </AppWrapper>
    );
  }

  return null;
}

export default Dash;
