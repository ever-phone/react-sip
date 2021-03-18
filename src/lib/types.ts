import * as PropTypes from "prop-types";
import { CallDirection, CallStatus, SipErrorType, SipStatus } from "./enums";

export interface ExtraHeaders {
  register?: string[];
  invite?: string[];
}
export const extraHeadersPropType = PropTypes.objectOf(
  PropTypes.arrayOf(PropTypes.string),
);

// https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer
export type IceServers = Array<{
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: string;
  password?: string;
}>;
export const iceServersPropType = PropTypes.arrayOf(PropTypes.object);

export interface Sip {
  status?: string;
  errorType?: string;
  errorMessage?: string;

  host?: string;
  port?: number;
  user?: string;
  password?: string;
  autoRegister?: boolean;
  autoAnswer: boolean;
  sessionTimersExpires: number;
  extraHeaders: ExtraHeaders;
  iceServers: IceServers;
  debug: boolean;
}
export const sipPropType = PropTypes.shape({
  status: PropTypes.string,
  errorType: PropTypes.string,
  errorMessage: PropTypes.string,

  host: PropTypes.string,
  port: PropTypes.number,
  user: PropTypes.string,
  password: PropTypes.string,
  autoRegister: PropTypes.bool,
  autoAnswer: PropTypes.bool,
  sessionTimersExpires: PropTypes.number,
  extraHeaders: extraHeadersPropType,
  iceServers: iceServersPropType,
  debug: PropTypes.bool,
});

export interface Call {
  id: string;
  status: string;
  direction: string;
  counterpart: string;
}
export const callPropType = PropTypes.shape({
  id: PropTypes.string,
  status: PropTypes.string,
  direction: PropTypes.string,
  counterpart: PropTypes.string,
});

export type Props = {
  host: string[];
  port: number;
  pathname: string;
  user: string[];
  password: string[];
  autoRegister: boolean;
  autoAnswer: boolean;
  iceRestart: boolean;
  sessionTimersExpires: number;
  extraHeaders: ExtraHeaders;
  iceServers: IceServers;
  debug: boolean;
};

export type State = {
  sipStatus: SipStatus;
  sipErrorType: SipErrorType | null;
  sipErrorMessage: string | null;
  callStatus: CallStatus;
  callDirection: CallDirection | null;
  callCounterpart: string | null;
  rtcSession: any;
};

export type NewRTCSession = { originator: any; session: any; request: any };
