import React from 'react';
import FlowContainer from '../containers/FlowContainer';

function Flow(props) {
  return (
    <div className="w-full h-full flex-grow flex flex-col">
      <FlowContainer {...props} />
    </div>
  );
}

export default Flow;
