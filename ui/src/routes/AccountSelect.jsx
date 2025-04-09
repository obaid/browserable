import React from 'react';
import AccountSelectContainer from '../containers/AccountSelectContainer';

function AccountSelect(props) {
  return (
    <div className="w-full h-full flex-grow flex flex-col">
      <AccountSelectContainer {...props} />
    </div>
  );
}

export default AccountSelect;
