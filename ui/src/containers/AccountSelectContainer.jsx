import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import Loader from "../components/Loader";
import { motion } from "motion/react";
import { useUpdateEffect } from "react-use";
import { selectUser, selectOtp } from "../selectors";
import useTreeChanges from "tree-changes-hook";

import { useAppSelector } from "modules/hooks";

import { STATUS } from "../literals";

import { getAccountsOfUser, createAccount } from "../actions";
import toast from "react-hot-toast";

function AccountSelect() {
  const dispatch = useDispatch();

  const user = useAppSelector(selectUser);

  const creatingAccount = user.createAccount.status === STATUS.RUNNING;
  const fetchingAccounts =
    user.accounts.status === STATUS.RUNNING ||
    user.accounts.status === STATUS.IDLE;

  const [accountName, setAccountName] = useState("AI playground");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [usecase, setUsecase] = useState("");

  const accounts = user.accounts.data || [];

  // if accounts length is 1, then redirect to the account
  if (accounts.length === 1) {
    window.location.href = `dash/${accounts[0].id}/new-task`;
  }


  useEffect(() => {
    dispatch(getAccountsOfUser());
  }, []);

  return (
    <div key="AccountSelect" data-testid="AccountSelect">
      <>
        <header className="container mx-auto py-6 px-4">
          <div className="flex items-center">
            <img src="/browserable-ai.png" alt="Logo" className="h-8" />
          </div>
        </header>
        {fetchingAccounts || user.accounts.data?.length > 0 ? (
          <div></div>
        ) : (
          <div className="container mx-auto my-12">
            <div className="max-w-lg mx-auto p-2">
              {user.accounts.data?.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8">
                  <h1 className="text-2xl font-extrabold mb-4">
                    Create an account
                  </h1>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="accountName"
                  >
                    Account name
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline input-text-sm"
                    id="accountName"
                    type="text"
                    placeholder="Account name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2 mt-4"
                    htmlFor="linkedInUrl"
                  >
                    LinkedIn URL
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline input-text-sm"
                    id="linkedInUrl"
                    type="text"
                    placeholder="LinkedIn URL"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                  />
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2 mt-4"
                    htmlFor="twitterUrl"
                  >
                    Twitter URL
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline input-text-sm"
                    id="twitterUrl"
                    type="text"
                    placeholder="Twitter URL"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                  />
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2 mt-4"
                    htmlFor="howDidYouHearAboutUs"
                  >
                    How can Browserable help you?
                  </label>
                  <textarea
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline input-text-sm"
                    id="howDidYouHearAboutUs"
                    placeholder="How can Browserable help you?"
                    value={usecase}
                    onChange={(e) => setUsecase(e.target.value)}
                  />
                  <button
                    className="mt-4 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    onClick={() => {
                      // send an error if account name is empty
                      if (accountName.trim() === "") {
                        toast.error("Account name cannot be empty");
                        return;
                      }

                      // if linkedInUrl is not a valid url, send an error
                      if (
                        linkedInUrl.trim() !== "" &&
                        !linkedInUrl.includes("linkedin.com")
                      ) {
                        toast.error("LinkedIn URL is not valid");
                        return;
                      }

                      // if twitterUrl is not a valid url, send an error
                      if (
                        twitterUrl.trim() !== "" &&
                        !twitterUrl.includes("x.com")
                      ) {
                        toast.error("Twitter URL is not valid");
                        return;
                      }

                      // if usecase is empty, send an error
                      if (usecase.trim() === "") {
                        toast.error("Usecase cannot be empty");
                        return;
                      }

                      dispatch(
                        createAccount({
                          accountName: accountName.trim(),
                          metadata: {
                            linkedInUrl: linkedInUrl.trim(),
                            twitterUrl: twitterUrl.trim(),
                            usecase: usecase.trim(),
                          },
                        })
                      );
                    }}
                  >
                    {creatingAccount ? (
                      <>
                        <i className="ri-loader-2-line animate-spin"></i>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
            {!fetchingAccounts && accounts.length > 0 ? (
              <div>
                <h1 className="text-2xl font-extrabold mb-2">
                  Select an account
                </h1>
                <p className="text-gray-500 mb-4">
                  There are multiple accounts available for you. You can select
                  any one of them to continue.
                </p>
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                  {accounts.map((account) => (
                    <div
                      className="bg-gray-100 rounded-lg p-4 cursor-pointer"
                      onClick={() => {
                        window.location.href = `dash/${account.id}/new-task`;
                      }}
                      key={account.id}
                    >
                      <div className="flex items-center">
                        <div className="flex-grow text-lg font-semibold">
                          {account.name}
                        </div>
                        <div className="flex-shrink-0">
                          <i className="ri-arrow-right-line"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </>
    </div>
  );
}

export default AccountSelect;
