import React from "react";
import IntegrationsContainer from "../containers/IntegrationsContainer";

function Integrations(props) {
  return (
    <div className="w-full h-full min-h-full flex flex-col flex-grow">
      <IntegrationsContainer {...props} />
    </div>
  );
}

export default Integrations;
