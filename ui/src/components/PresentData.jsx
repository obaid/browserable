import React from "react";
import ExpandableText from "./ExpandableText";
import ReactMarkdown from "react-markdown";

function PresentData({ data, root = false }) {
  // Handle primitive types
  if (typeof data !== "object" && data !== null) {
    return (
      <div className="w-full">
        <ExpandableText text={String(data)} maxLength={500} />
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }

    if (data.length === 1 && typeof data[0] === "object" && data[0] !== null) {
      return <PresentData data={data[0]} />;
    } else {
      return (
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={index}>
              <PresentData key={index} data={item} />
            </div>
          ))}
        </div>
      );
    }
  }

  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);

    return (
      <div className="w-full prose prose-sm prose-h3:mb-0 prose-h3:mt-2 prose-h3:text-sm">
        {keys.map((key) => {
          const value = data[key];
          const isValueShort = typeof value === "string" && value.length < 20;
          if (!isValueShort) {
            return (
              <div key={key}>
                <h3>{key}</h3>
                <PresentData data={value} />
              </div>
            );
          } else {
            return (
              <div key={key}>
                <h3>
                  {key}: <span className="text-gray-500">{value}</span>
                </h3>
              </div>
            );
          }
        })}
      </div>
    );
  }
}

export default PresentData;
