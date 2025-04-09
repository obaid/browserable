import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAppSelector } from "modules/hooks";
import useInterval from "beautiful-react-hooks/useInterval";
import { useDispatch } from "react-redux";
import { STATUS } from "../literals";
import useCookie from "../hooks/useCookie";
import axios from "axios";
import { readableDate } from "../components/utils";
import UppyComponent from "../components/Uppy";
import useLocalStorage from "../hooks/useLocalStorage";
import { selectUser, selectOtp } from "../selectors";
import {
  updateUser,
  createAPIKey,
  getAPIKeys,
  deleteAPIKey,
  updateAccountApiKeys,
  logout,
} from "../actions";
import useTreeChanges from "tree-changes-hook";
import { Switch } from "@headlessui/react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

import AppWrapper from "./AppWraper";

function SettingsContainer(props) {
  const dispatch = useDispatch();
  const userState = useAppSelector(selectUser);
  const { user, account } = userState;
  const { changed } = useTreeChanges(userState);
  const actions = useAppSelector(selectOtp);
  const [token, setToken] = useCookie(
    process.env.REACT_APP_COOKIE_UUID_KEY || "browserable_uuid",
    ""
  );

  const currentName = (user.data || {}).name || "";
  const currentPic = (user.data || {}).pic || "";
  const currentSettings = (user.data || {}).settings || {};

  const [showPicUploader, setShowPicUploader] = useState(false);

  const [name, setName] = useState(currentName);
  const [pic, setPic] = useState(currentPic);
  const [settings, setSettings] = useState({
    ...currentSettings,
  });

  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [folderPath, setFolderPath] = useState(
    `user-files/${props.userId}/profile`
  ); // Store folder path

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folderPath); // Send folder path to backend

      try {
        setUploadStatus("Uploading...");
        const response = await axios.post(
          `${process.env.REACT_APP_TASKS_PUBLIC_URL}/helpers/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        setPic(response.data.url);
        setShowPicUploader(false);
        setUploadedFileUrl(response.data.url);
        setUploadStatus("Upload successful!");
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("Upload failed");
      }
    },
    [folderPath]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  useEffect(() => {
    if (changed("user.data.name")) {
      setName(user.data.name);
    }
  }, [user.data.name]);

  useEffect(() => {
    if (changed("user.data.pic")) {
      setPic(user.data.pic);
    }
  }, [user.data.picture]);

  const activeUpdateButton = name !== currentName || pic !== currentPic;

  const accountName = account.data?.name;

  useEffect(() => {
    if (account.data) {
      dispatch(getAPIKeys({ accountId: account.data.id }));
    }
  }, [account.data]);

  const apiKeys = account.apiKeys.data || [];
  const [newApiKeyName, setNewApiKeyName] = useState("");

  const accountDataFetched = !!account.data;
  const metadata = account.data?.metadata || {};
  const {
    userApiKeys = {},
    systemApiKeys = {},
    userBrowserApiKeys = {},
    systemBrowserApiKeys = {},
  } = metadata;

  const systemApiKeysMissing =
    accountDataFetched &&
    Object.keys(systemApiKeys).filter((key) => systemApiKeys[key]).length === 0;

  const systemBrowserApiKeysMissing =
    accountDataFetched &&
    Object.keys(systemBrowserApiKeys).filter((key) => systemBrowserApiKeys[key])
      .length === 0;

  const showApiKeys =
    !!Number(process.env.REACT_APP_SINGLE_USER_MODE) && systemApiKeysMissing;

  const showBrowserApiKeys =
    !!Number(process.env.REACT_APP_SINGLE_USER_MODE) &&
    systemBrowserApiKeysMissing;

  const apiKeysUpdating = account.apiKeys.updateStatus === STATUS.RUNNING;

  // State for LLM API keys
  const [llmApiKeys, setLlmApiKeys] = useState({
    openai: userApiKeys?.openai || "",
    claude: userApiKeys?.claude || "",
    gemini: userApiKeys?.gemini || "",
  });

  const [browserApiKeys, setBrowserApiKeys] = useState({
    hyperBrowser: userBrowserApiKeys?.hyperBrowser || "",
    steel: userBrowserApiKeys?.steel || "",
    // browserbase: userBrowserApiKeys?.browserbase || "",
    // browserbaseProjectId: userBrowserApiKeys?.browserbaseProjectId || "",
  });

  // Update llmApiKeys when account data changes
  useEffect(() => {
    if (account.data?.metadata?.userApiKeys) {
      setLlmApiKeys({
        openai: account.data.metadata.userApiKeys.openai || "",
        claude: account.data.metadata.userApiKeys.claude || "",
        gemini: account.data.metadata.userApiKeys.gemini || "",
      });
    }
  }, [account.data]);

  useEffect(() => {
    if (account.data?.metadata?.userBrowserApiKeys) {
      setBrowserApiKeys({
        hyperBrowser:
          account.data.metadata.userBrowserApiKeys.hyperBrowser || "",
        steel: account.data.metadata.userBrowserApiKeys.steel || "",
        // browserbase: account.data.metadata.userBrowserApiKeys.browserbase || "",
        // browserbaseProjectId: account.data.metadata.userBrowserApiKeys.browserbaseProjectId || "",
      });
    }
  }, [account.data]);

  // Check if API keys have changed
  const hasApiKeysChanged =
    JSON.stringify(llmApiKeys) !==
      JSON.stringify({
        openai: userApiKeys?.openai || "",
        claude: userApiKeys?.claude || "",
        gemini: userApiKeys?.gemini || "",
      }) ||
    JSON.stringify(browserApiKeys) !==
      JSON.stringify({
        hyperBrowser: userBrowserApiKeys?.hyperBrowser || "",
        steel: userBrowserApiKeys?.steel || "",
        // browserbase: userBrowserApiKeys?.browserbase || "",
        // browserbaseProjectId: userBrowserApiKeys?.browserbaseProjectId || "",
      });

  // Handle API key changes
  const handleApiKeyChange = (provider, value) => {
    setLlmApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const handleBrowserApiKeyChange = (provider, value) => {
    setBrowserApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  // Handle save API keys
  const handleSaveApiKeys = () => {
    dispatch(
      updateAccountApiKeys({
        accountId: account.data.id,
        metadata: {
          ...metadata,
          userApiKeys: llmApiKeys,
          userBrowserApiKeys: browserApiKeys,
        },
      })
    );
  };

  return (
    <AppWrapper {...props} settingsPage={true}>
      <div className={`flex-grow p-4 flex flex-col gap-8 overflow-y-scroll`}>
        {!Number(process.env.REACT_APP_SINGLE_USER_MODE) && (
          <div className="max-w-md">
            <h2 className="font-black text-lg mb-2">Account</h2>
            <div className="flex flex-col gap-1">
              <input
                className="appearance-none border-none bg-gray-100 rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                value={accountName}
                disabled
              />
              <input
                className="appearance-none border-none bg-gray-100 rounded w-full py-2 px-3 text-sm text-gray-700 leading-tight"
                id="email"
                type="email"
                value={(user.data || {}).email || ""}
                disabled
              />
              <button
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-1 max-w-16 px-2 rounded focus:outline-none focus:shadow-outline text-sm"
                onClick={() => {
                  dispatch(logout());
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {(showApiKeys || showBrowserApiKeys) && (
          <div className="w-full flex flex-col gap-4">
            {showApiKeys && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="font-black text-lg">LLM API Keys</h2>
                  <p className="text-sm text-gray-600">
                    Enter your LLM API keys below.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50">
                      <tr className="border-b text-xs font-semibold">
                        <th className="text-left py-1.5 font-semibold px-6">
                          Name
                        </th>
                        <th className="text-left py-1.5 font-semibold px-6">
                          API Key
                        </th>
                        <th className="text-left py-1.5 font-semibold px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries({
                        OpenAI: "openai",
                        Anthropic: "anthropic",
                        Gemini: "gemini",
                      }).map(([displayName, provider]) => (
                        <tr
                          key={provider}
                          className="border-b text-xs hover:bg-gray-50"
                        >
                          <td className="py-1.5 px-6">{displayName}</td>
                          <td className="py-1.5 px-6 font-mono text-sm">
                            <input
                              type="password"
                              className="appearance-none border border-gray-300 rounded w-full py-1 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              value={llmApiKeys[provider]}
                              onChange={(e) =>
                                handleApiKeyChange(provider, e.target.value)
                              }
                              placeholder={`Enter ${displayName} API Key`}
                            />
                          </td>
                          <td className="py-1.5 px-6">
                            <button
                              className="text-gray-600 hover:text-red-600"
                              onClick={() => handleApiKeyChange(provider, "")}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {showBrowserApiKeys && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="font-black text-lg">
                    Remote Browser API Keys
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter your remote browser API keys below.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50">
                      <tr className="border-b text-xs font-semibold">
                        <th className="text-left py-1.5 font-semibold px-6">
                          Name
                        </th>
                        <th className="text-left py-1.5 font-semibold px-6">
                          API Key
                        </th>
                        <th className="text-left py-1.5 font-semibold px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries({
                        HyperBrowser: "hyperBrowser",
                        Steel: "steel",
                        // Browserbase: "browserbase",
                        // "Browserbase Project ID": "browserbaseProjectId",
                      }).map(([displayName, provider]) => (
                        <tr
                          key={provider}
                          className="border-b text-xs hover:bg-gray-50"
                        >
                          <td className="py-1.5 px-6">{displayName}</td>
                          <td className="py-1.5 px-6 font-mono text-sm">
                            <input
                              type="password"
                              className="appearance-none border border-gray-300 rounded w-full py-1 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              value={browserApiKeys[provider]}
                              onChange={(e) =>
                                handleBrowserApiKeyChange(
                                  provider,
                                  e.target.value
                                )
                              }
                              placeholder={`Enter ${displayName} ${provider === "browserbaseProjectId" ? "" : "API Key"}`}
                            />
                          </td>
                          <td className="py-1.5 px-6">
                            <button
                              className="text-gray-600 hover:text-red-600"
                              onClick={() =>
                                handleBrowserApiKeyChange(provider, "")
                              }
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                className={`flex items-center gap-2 px-4 py-1 rounded text-sm font-medium ${
                  hasApiKeysChanged 
                    ? "bg-gray-800 hover:bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                onClick={handleSaveApiKeys}
                disabled={!hasApiKeysChanged}
              >
                {apiKeysUpdating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving
                  </>
                ) : (
                  "Save API Keys"
                )}
              </button>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-black text-lg">Browserable API Keys</h2>
            <p className="text-sm text-gray-600">
              Do not share your API key with others or expose it in the browser
              or other client-side code.{" "}
            </p>
          </div>

          {apiKeys.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr className="border-b text-xs font-semibold">
                    <th className="text-left py-1.5 font-semibold px-6">
                      Name
                    </th>
                    <th className="text-left py-1.5 font-semibold px-6">
                      API Key
                    </th>
                    <th className="text-left py-1.5 font-semibold px-6">
                      Created
                    </th>
                    <th className="text-left py-1.5 font-semibold px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((apiKey) => (
                    <tr
                      key={apiKey.id}
                      className="border-b text-xs hover:bg-gray-50"
                    >
                      <td className="py-1.5 px-6">{apiKey.name}</td>
                      <td className="py-1.5 px-6 font-mono text-sm">
                        {apiKey.api_key
                          ? apiKey.api_key.substring(0, 8) + "..."
                          : "..."}
                        <button
                          className="ml-2 text-gray-600 hover:text-blue-600"
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey.api_key);
                            toast.success("API key copied to clipboard!");
                          }}
                        >
                          <i className="ri-file-copy-line"></i>
                        </button>
                      </td>
                      <td className="py-1.5 px-6">
                        {readableDate(apiKey.created_at)}
                      </td>
                      <td className="py-1.5 px-6">
                        <div className="flex gap-2">
                          <button
                            className="text-gray-600 hover:text-red-600"
                            onClick={() => {
                              dispatch(
                                deleteAPIKey({
                                  accountId: account.data.id,
                                  apiKeyId: apiKey.id,
                                })
                              );
                            }}
                          >
                            {account.apiKeys.deleteStatus === STATUS.RUNNING ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              className="appearance-none border border-gray-300 rounded w-48 py-1 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="API Key Name"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
            />
            <button
              className="w-fit bg-gray-800 hover:bg-gray-900 text-white  py-1 px-4 rounded focus:outline-none text-sm flex items-center gap-2"
              onClick={() => {
                dispatch(
                  createAPIKey({
                    accountId: account.data.id,
                    name: newApiKeyName,
                  })
                );
                setNewApiKeyName("");
              }}
              disabled={!newApiKeyName.trim()}
            >
              {account.apiKeys.createStatus === STATUS.RUNNING ? (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <i className="ri-add-line"></i>
              )}
              Create new API key
            </button>
          </div>
        </div>

        <div className="max-w-md flex flex-col gap-4"></div>
      </div>
    </AppWrapper>
  );
}

export default SettingsContainer;
