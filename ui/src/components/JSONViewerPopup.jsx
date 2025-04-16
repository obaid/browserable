import React, { useRef, useEffect, useState } from "react";

function JSONViewerPopup({ isOpen, onClose, data, type }) {
  if (!isOpen) return null;

  const popupRef = useRef(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const renderPromptMessages = (messages) => {
    if (!Array.isArray(messages)) return JSON.stringify(messages, null, 2);

    return messages.map((msg, index) => (
      <div
        key={index}
        className="mb-4 border-b border-gray-200 pb-4 last:border-0"
      >
        <div className="font-medium text-gray-700 mb-2">
          {msg.role === "system" && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
              System
            </span>
          )}
          {msg.role === "user" && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              User
            </span>
          )}
          {msg.role === "assistant" && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              Assistant
            </span>
          )}
        </div>
        <pre className="whitespace-pre-wrap text-sm text-gray-600">
          {msg.content}
        </pre>
      </div>
    ));
  };

  const handleCopy = async () => {
    const textToCopy = type === "prompt" && data.messages 
      ? JSON.stringify(data.messages, null, 2)
      : JSON.stringify(data, null, 2);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={popupRef}
        className="bg-white rounded-lg w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-medium text-gray-900">
            {type === "prompt"
              ? "Prompt Details"
              : type === "response"
              ? "Response Details"
              : type === "token meta"
              ? "Token Meta Details"
              : type === "metadata"
              ? "Metadata Details"
              : type}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div
          className="p-6 overflow-y-auto flex-grow"
          style={{ maxHeight: "calc(80vh - 140px)" }}
        >
          {type === "prompt" && data.messages ? (
            renderPromptMessages(data.messages)
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end items-center">
          <div className="relative">
            <button
              onClick={handleCopy}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold flex items-center space-x-2 transition-colors"
            >
              <i className="ri-file-copy-line"></i>
              <span>Copy to Clipboard</span>
            </button>
            {showCopySuccess && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                Copied successfully!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JSONViewerPopup;
