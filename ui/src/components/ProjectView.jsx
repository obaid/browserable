import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import PresentData from "./PresentData";
import TextareaAutosize from "react-textarea-autosize";
import TextLoader from "./TextLoader";
import Message from "./Message";

function ProjectView({
  flowDetails,
  activeRunStatus,
  flowData,
  flowStatus,
  showThinking,
  userInput,
  setUserInput,
  userInputRef,
  isSubmitting,
  handleSubmitUserInput,
  showSubmitButton,
  isActive,
  flowMessages,
  messagesContainerRef,
  handleScroll,
  flowSuperStatus,
  showArchiveButton,
  isArchiving,
  isStopping,
  handleStopFlow,
  handleArchiveFlow,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeHovered, setIsIframeHovered] = useState(false);

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

  return (
    <div className="flex flex-col justify-center items-center h-full overflow-hidden">
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-7xl h-[90vh] relative"
            >
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
              <iframe
                src={activeRunStatus.data.liveStatus}
                className="w-full h-full rounded-xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex w-full h-full">
        <div className="w-1/2 flex flex-col p-4 space-y-2 overflow-y-auto">
          {flowDetails.data?.readable_name ? (
            <div className="text-xl text-black font-black">
              {flowDetails.data?.readable_name}
            </div>
          ) : null}
          {flowDetails.data?.readable_description ? (
            <div className="text-sm text-gray-500">
              {flowDetails.data?.readable_description}
            </div>
          ) : null}
          {flowDetails.data?.metadata?.readableDescriptionOfTriggers ? (
            <div className="text-sm text-gray-500">
              {flowDetails.data?.metadata?.readableDescriptionOfTriggers}
            </div>
          ) : null}
          {activeRunStatus.data?.liveStatus ? (
            <div className="">
              <div
                className="w-full relative"
                style={{ paddingBottom: "100%" }}
                onMouseEnter={() => setIsIframeHovered(true)}
                onMouseLeave={() => setIsIframeHovered(false)}
              >
                <iframe
                  src={activeRunStatus.data.liveStatus}
                  className="absolute top-0 left-0 w-full h-full rounded-xl border-2 border-gray-300"
                />
                <AnimatePresence>
                  {isIframeHovered && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFullscreen(true)}
                      className="absolute top-4 right-4 bg-black/75 hover:bg-black text-white p-2 rounded-lg shadow-lg backdrop-blur-sm"
                    >
                      <i className="ri-fullscreen-line text-lg"></i>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
          {flowData.data && flowData.data.length === 1 ? (
            <div>
              {flowData.data[0].Status === "SUCCESS" ? (
                <div className="text-green-500">
                  <i className="ri-check-circle-line"></i>
                  <span>Success</span>
                </div>
              ) : flowData.data[0].Status === "FAILURE" ? (
                <div className="text-red-500">
                  <i className="ri-close-circle-line"></i>
                  <span>Failure</span>
                </div>
              ) : null}
            </div>
          ) : null}


          {/* <div
            style={{
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            {getReport(flowData.data) ? (
              <div className={`flex w-full`}>
                <div
                  className={`py-1 flex gap-4 items-flex-start prose break-words`}
                  style={{
                    minWidth: "0",
                  }}
                >
                  <div
                    className="flex flex-col gap-2 border-t-2 border-gray-300 pt-8 pb-6 mt-6"
                    style={{
                      minWidth: "0",
                    }}
                  >
                    <Message content={getReport(flowData.data)} />
                  </div>
                </div>
              </div>
            ) : null}
            {flowData.data && flowData.data.length > 0 && (
              <div
                className={`flex max-w-full pb-12 pt-12 border-t-2 border-gray-300 overflow-y-auto overflow-x-auto text-xs ${
                  !getReport(flowData.data) ? "mt-6" : ""
                }`}
              >
                <PresentData data={cleanFlowData(flowData.data)} root={true} />
              </div>
            )}
          </div> */}
        </div>
        <div className="w-1/2 h-full flex flex-col">
          <div className="flex flex-col flex-grow h-full bg-gray-50">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-grow px-2 py-2 space-y-6 overflow-y-auto break-words text-sm"
            >
              {flowMessages.data?.map(({ id, messages }) =>
                messages.map((message, index) => (
                  <div className={`flex w-full`} key={`${id}-${index}`}>
                    <div
                      className={`px-4 py-1 flex gap-4 items-flex-start ${
                        message.role === "user" ? "" : " prose-sm"
                      }`}
                      style={{
                        lineHeight: "1.5",
                      }}
                    >
                      <div className="flex items-flex-start gap-2">
                        {message.role === "user" ? (
                          <i className="ri-user-line"></i>
                        ) : (
                          <i className="ri-robot-2-line"></i>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {message.role === "user" ? (
                          <div className="font-bold">
                            <span>You</span>
                          </div>
                        ) : null}
                        <Message content={message.content} />
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isActive && showThinking && (
                <div className="block w-full">
                  <div className="block float-left px-4">
                    <div className="flex items-center space-x-2 py-2">
                      <div className="h-5 w-10 flex items-center justify-center">
                        <TextLoader />
                      </div>
                      <div
                        className={`text-sm text-gray-500 ${
                          flowStatus.split(" ").length === 1 ? "capitalize" : ""
                        }`}
                      >
                        {flowStatus}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-2 bg-white rounded p-2">
                <TextareaAutosize
                  className="w-full border-transparent text-sm focus:border-transparent focus:ring-0 focus:ring-offset-0 resize-none h-24 border-2 border-gray-300 rounded-md p-2"
                  placeholder={!showSubmitButton ? "" : "Type your message here."}
                  value={userInput}
                  disabled={!showSubmitButton}
                  minRows={1}
                  maxRows={4}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmitUserInput();
                    }
                  }}
                  ref={userInputRef}
                />
                <div
                  className="w-full flex cursor-pointer justify-end items-center gap-2"
                  onClick={() => {
                    userInputRef.current.focus();
                  }}
                >
                  {flowSuperStatus === "active" ? (
                    <motion.div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStopFlow();
                      }}
                      className={`leading-none bg-gray-800 text-sm cursor-pointer hover:bg-gray-900 text-white px-2 py-1.5 rounded flex items-center justify-center gap-2`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {isStopping ? (
                        <>
                          <i className="ri-loader-2-line animate-spin"></i>
                          <span>Stopping</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-stop-circle-line"></i>
                          <span>Stop task</span>
                        </>
                      )}
                    </motion.div>
                  ) : null}
                  {showArchiveButton && (
                    <motion.div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleArchiveFlow();
                      }}
                      className={`leading-none bg-gray-800 text-sm cursor-pointer hover:bg-gray-900 text-white px-2 py-1.5 rounded flex items-center justify-center gap-2`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {isArchiving ? (
                        <>
                          <i className="ri-loader-2-line animate-spin"></i>
                          <span>Archiving</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-archive-line"></i>
                          <span>Archive</span>
                        </>
                      )}
                    </motion.div>
                  )}
                  {showSubmitButton && (
                    <motion.div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmitUserInput();
                      }}
                      className={`leading-none bg-gray-800 text-sm cursor-pointer hover:bg-gray-900 text-white px-2 py-1.5 rounded flex items-center justify-center gap-2`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="ri-loader-2-line animate-spin"></i>
                          <span>Submitting</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-corner-down-left-line"></i>
                          <span>Submit</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectView;
