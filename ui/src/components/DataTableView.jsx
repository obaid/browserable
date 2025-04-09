import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "modules/hooks";
import { getDataTableDocuments } from "../actions/flow";
import { selectFlows, selectUser } from "../selectors";
import JSONViewerPopup from "./JSONViewerPopup";
import { STATUS } from "../literals";

function DataTableView({ flowId }) {
  const dispatch = useDispatch();
  const [pageSize, setPageSize] = useState(50);
  const [selectedJSON, setSelectedJSON] = useState(null);
  const [jsonType, setJsonType] = useState(null);

  const userState = useAppSelector(selectUser);
  const flowState = useAppSelector(selectFlows);
  const dataTableDocuments = flowState.dataTableDocumentsMap[flowId] || {};
  const { data = {}, status, error } = dataTableDocuments;
  let {
    documents = [],
    total,
    schema = [],
    pageNumber,
    totalPages = 1,
  } = data || {};
  schema = schema || [];
  const { user, account } = userState;
  const accountId = account?.data?.id;

  const handlePageSizeChange = (event) => {
    // dont perform if status is running
    if (status === STATUS.RUNNING) {
      return;
    }

    setPageSize(Number(event.target.value));
    dispatch(
      getDataTableDocuments({
        flowId,
        pageSize: Number(event.target.value),
        pageNumber: 1,
        accountId,
      })
    );
  };

  const handlePrevPage = () => {
    // dont perform if status is running
    if (status === STATUS.RUNNING) {
      return;
    }

    if (pageNumber > 1) {
      dispatch(
        getDataTableDocuments({
          flowId,
          pageSize,
          pageNumber: pageNumber - 1,
          accountId,
        })
      );
    }
  };

  const handleNextPage = () => {
    // dont perform if status is running
    if (status === STATUS.RUNNING) {
      return;
    }

    if (pageNumber < totalPages) {
      dispatch(
        getDataTableDocuments({
          flowId,
          pageSize,
          pageNumber: pageNumber + 1,
          accountId,
        })
      );
    }
  };

  const handleRefresh = () => {
    // dont perform if status is running
    if (status === STATUS.RUNNING) {
      return;
    }

    dispatch(
      getDataTableDocuments({
        flowId,
        pageSize,
        pageNumber: pageNumber,
        accountId,
      })
    );
  };

  const handleViewJSON = (data, type) => {
    setSelectedJSON(data);
    setJsonType(type);
  };

  const handleCloseJSON = () => {
    setSelectedJSON(null);
    setJsonType(null);
  };

  useEffect(() => {
    dispatch(
      getDataTableDocuments({ flowId, pageSize, pageNumber: 1, accountId })
    );
  }, [flowId, pageSize]);

  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        {/* <select
          className="px-3 py-1 w-32 border border-gray-300 rounded-md text-sm"
          value={pageSize}
          onChange={handlePageSizeChange}
        >
          <option value={50}>50 per page</option>
        </select> */}
        <div></div>

        <div className="flex text-xs items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={data.pageNumber <= 1}
            className={`px-3 py-1 rounded-md border ${
              data.pageNumber <= 1
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {data.pageNumber} of {totalPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= totalPages}
            className={`px-3 py-1 rounded-md border ${
              pageNumber >= totalPages
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            <i
              className={`ri-refresh-line block ${
                status === STATUS.RUNNING ? "animate-spin" : ""
              }`}
            ></i>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-1.5 text-left text-xs font-semibold py-1.5 max-w-[250px]">
                No.
              </th>
              {schema.map((column) => (
                <th className="px-6 py-1.5 text-left text-xs font-semibold py-1.5 max-w-[250px]">
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document, index) => (
              <tr key={document.rowId} className="hover:bg-gray-50">
                <td className="px-6 py-1.5 whitespace-nowrap text-xs max-w-[250px] truncate cursor-pointer">
                  {index + 1 + (pageNumber - 1) * pageSize}
                </td>
                {schema.map((column) => (
                  <td
                    className="px-6 py-1.5 whitespace-nowrap text-xs max-w-[250px] truncate cursor-pointer"
                    onClick={() =>
                      handleViewJSON(document[column.key], column.name)
                    }
                  >
                    {document[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <JSONViewerPopup
        isOpen={selectedJSON !== null}
        onClose={handleCloseJSON}
        data={selectedJSON}
        type={jsonType}
      />
    </div>
  );
}

export default DataTableView;
