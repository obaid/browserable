import React, { useEffect } from "react";
import { useAppSelector } from "modules/hooks";
import { useDispatch } from "react-redux";
import { STATUS } from "../literals";
import useCookie from "../hooks/useCookie";
import { selectUser } from "../selectors";
import { getIntegrations } from "../actions";
import AppWrapper from "./AppWraper";
import genFingerprint from "../fingerprint";

// import FingerprintJS from '@fingerprintjs/fingerprintjs';

function getFingerPrint() {
  return genFingerprint();
  // const fp = await FingerprintJS.load();

  // const { visitorId } = await fp.get();

  // return visitorId;
}

function IntegrationsContainer(props) {
  const dispatch = useDispatch();
  const userState = useAppSelector(selectUser);
  const { user, integrations, account } = userState;
  const [token] = useCookie(
    process.env.REACT_APP_COOKIE_UUID_KEY || "browserable_uuid",
    ""
  );

  const accountId = account?.data?.id;

  useEffect(() => {
    if (accountId) {
      dispatch(
        getIntegrations({
          accountId,
        })
      );
    }
  }, [accountId]);

  const isLoading = integrations.status === STATUS.RUNNING;

  return (
    <AppWrapper {...props} settingsPage={true}>
      {token && props.userId ? (
        <div className="p-6 max-h-full flex flex-col">
          <h1 className="text-2xl font-black  mb-8">Integrations</h1>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-8 overflow-y-auto flex-grow">
              {(integrations.data || []).map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-start space-x-6 border-b pb-8"
                >
                  <img
                    src={`${process.env.REACT_APP_TASKS_PUBLIC_URL}/integrations/${integration.icon}`}
                    alt={integration.name}
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-black">{integration.name}</h2>
                    <p className="text-gray-600">{integration.description}</p>
                    <div className="mt-2">
                      <span
                        className={`rounded-lg px-2 py-1 text-sm font-medium ${
                          integration.meta.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {integration.meta.enabled
                          ? "Connected"
                          : "Not connected"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {!integration.meta.enabled &&
                      integration.meta.setup.callbackUrl ? (
                        <a
                          href={`${integration.meta.setup.callbackUrl}?fingerprint=${getFingerPrint()}`}
                          className="flex mt-2 rounded-md bg-gray-800 text-white px-2 py-0.5 hover:bg-gray-900"
                        >
                          <span>Connect {integration.name}</span>
                        </a>
                      ) : null}
                      {integration.meta.actions.map((action) => (
                        <a
                          href={action.callbackUrl}
                          className="flex mt-2 rounded-md bg-gray-800 text-white px-2 py-0.5 hover:bg-gray-900"
                        >
                          <span>{action.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AppWrapper>
  );
}

export default IntegrationsContainer;
