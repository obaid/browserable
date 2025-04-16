import React from 'react';
import ReactMarkdown from 'react-markdown';

function Message({ content }) {
  if (typeof content === "string") {
    return <span className="whitespace-pre-wrap break-all">{content}</span>;
  } else if (Array.isArray(content)) {
    return content.map((c, j) => <Message key={j} content={c} />);
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
          <span className="whitespace-pre-wrap break-all">{content.text}</span>
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
  return null;
}

function getAssociateDataHelper(data) {
  const [collapsed, setCollapsed] = React.useState(false);
  const { type, markdown, code, url, name } = data;
  
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
        {type === "markdown" ? (
          <i className="ri-markdown-line"></i>
        ) : type === "code" ? (
          <i className="ri-code-line"></i>
        ) : type === "image" ? (
          <i className="ri-image-line"></i>
        ) : null}
      </div>
      {collapsed ? (
        <div className="ml-4 rounded-md bg-gray-100 border-2 border-transparent">
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
              <code className="whitespace-break-spaces bread-words">
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
    return content.associatedData.map((data, index) => {
      return <React.Fragment key={index}>{getAssociateDataHelper(data)}</React.Fragment>;
    });
  }
  return null;
}

export default Message; 