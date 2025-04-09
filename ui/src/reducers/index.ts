import alerts, { alertsState } from './alerts';
import app, { appState } from './app';
import github, { githubState } from './github';
import user, { userState } from './user';
import otp, { otpState } from './user';
import flow, { flowState } from './flow';

export const initialState = {
  alerts: alertsState,
  app: appState,
  github: githubState,
  user: userState,
  otp: otpState,
  flow: flowState,
};

export default {
  ...alerts,
  ...app,
  ...github,
  ...user,
  ...otp,
  ...flow,
};
