import * as JsSIP from "jssip";
import * as PropTypes from "prop-types";
import * as React from "react";
import dummyLogger from "../../lib/dummyLogger";
import {
  CALL_DIRECTION_INCOMING,
  CALL_DIRECTION_OUTGOING,
  CALL_STATUS_ACTIVE,
  CALL_STATUS_IDLE,
  CALL_STATUS_STARTING,
  CALL_STATUS_STOPPING,
  SIP_ERROR_TYPE_CONFIGURATION,
  SIP_ERROR_TYPE_CONNECTION,
  SIP_ERROR_TYPE_REGISTRATION,
  SIP_STATUS_CONNECTED,
  SIP_STATUS_CONNECTING,
  SIP_STATUS_DISCONNECTED,
  SIP_STATUS_ERROR,
  SIP_STATUS_REGISTERED,
} from "../../lib/enums";
import {
  callPropType,
  extraHeadersPropType,
  iceServersPropType,
  sipPropType,
  Props,
  State,
  NewRTCSession,
} from "../../lib/types";

export default class App extends React.Component<Props, { infos: State[] }> {
  public static childContextTypes = {
    users: PropTypes.arrayOf(
      PropTypes.shape({ sip: sipPropType, call: callPropType }),
    ),

    registerSip: PropTypes.func,
    unregisterSip: PropTypes.func,

    answerCall: PropTypes.func,
    startCall: PropTypes.func,
    stopCall: PropTypes.func,
    holdCall: PropTypes.func,
    unholdCall: PropTypes.func,
    muteCall: PropTypes.func,
    unmuteCall: PropTypes.func,

    sendDTMF: PropTypes.func,
  };

  public static propTypes = {
    host: PropTypes.arrayOf(PropTypes.string),
    port: PropTypes.number,
    pathname: PropTypes.string,
    user: PropTypes.arrayOf(PropTypes.string),
    password: PropTypes.arrayOf(PropTypes.string),
    autoRegister: PropTypes.bool,
    autoAnswer: PropTypes.bool,
    iceRestart: PropTypes.bool,
    sessionTimersExpires: PropTypes.number,
    extraHeaders: extraHeadersPropType,
    iceServers: iceServersPropType,
    debug: PropTypes.bool,

    children: PropTypes.node,
  };

  public static defaultProps = {
    host: [],
    port: null,
    pathname: "",
    user: [],
    password: [],
    autoRegister: true,
    autoAnswer: false,
    iceRestart: false,
    sessionTimersExpires: 120,
    extraHeaders: { register: [], invite: [] },
    iceServers: [],
    debug: false,

    children: null,
  };

  private ua: any;
  private remoteAudio: any;
  private logger: any;
  private count: number;

  constructor(props: Props) {
    super(props);

    this.ua = [];
    this.state = { infos: [] };

    this.count = 0;
  }

  public getChildContext() {
    let users: any[] = [];

    for (let i = 0; i < this.count; i++) {
      const tmp = {
        sip: {
          ...this.props,
          host: this.props.host[i],
          user: this.props.user[i],
          password: this.props.password[i],
          status: this.state.infos[i].sipStatus,
          errorType: this.state.infos[i].sipErrorType,
          errorMessage: this.state.infos[i].sipErrorMessage,
        },
        call: {
          id: "??",
          status: this.state.infos[i].callStatus,
          direction: this.state.infos[i].callDirection,
          counterpart: this.state.infos[i].callCounterpart,
        },
      };

      users = [...users, tmp];
    }

    return {
      users,

      registerSip: this.registerSip,
      unregisterSip: this.unregisterSip,

      answerCall: this.answerCall,
      startCall: this.startCall,
      stopCall: this.stopCall,
      holdCall: this.holdCall,
      unholdCall: this.unholdCall,
      muteCall: this.muteCall,
      unmuteCall: this.unmuteCall,
      sendDTMF: this.sendDTMF,
    };
  }

  public componentDidMount() {
    if (window.document.getElementById("sip-provider-audio")) {
      throw new Error(
        `Creating two SipProviders in one application is forbidden. If that's not the case ` +
          `then check if you're using "sip-provider-audio" as id attribute for any existing ` +
          `element`,
      );
    }

    this.remoteAudio = window.document.createElement("audio");
    this.remoteAudio.id = "sip-provider-audio";
    window.document.body.appendChild(this.remoteAudio);

    let length = [
      this.props.host.length,
      this.props.user.length,
      this.props.password.length,
    ];
    if (Array.from(new Set(length))[1]) {
      throw new Error(`There is a problem with the Props value `);
    }

    this.count = this.props.host.length;

    const tmp: State = {
      sipStatus: SIP_STATUS_DISCONNECTED,
      sipErrorType: null,
      sipErrorMessage: null,

      rtcSession: null,
      // errorLog: [],
      callStatus: CALL_STATUS_IDLE,
      callDirection: null,
      callCounterpart: null,
    };

    for (let i = 0; i < this.count; i++) {
      this.setState((state) => {
        const infos = [...state.infos, tmp];
        return { infos };
      });
    }

    this.reconfigureDebug();
    this.reinitializeJsSIP();
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.debug !== prevProps.debug) {
      this.reconfigureDebug();
    }
    if (
      this.props.host !== prevProps.host ||
      this.props.port !== prevProps.port ||
      this.props.pathname !== prevProps.pathname ||
      this.props.user !== prevProps.user ||
      this.props.password !== prevProps.password ||
      this.props.autoRegister !== prevProps.autoRegister
    ) {
      this.count = this.props.host.length;
      this.reinitializeJsSIP();
    }
  }

  public componentWillUnmount() {
    this.remoteAudio.parentNode.removeChild(this.remoteAudio);
    delete this.remoteAudio;
    if (this.ua.length) {
      for (let i = 0; i < this.ua.length; i++) {
        if (!this.ua[i]) continue;
        this.ua[i].stop();
      }
      this.ua = [];
    }
  }

  public registerSip = (i: number) => {
    if (this.props.autoRegister) {
      throw new Error(
        "Calling registerSip is not allowed when autoRegister === true",
      );
    }
    if (this.state.infos[i].sipStatus !== SIP_STATUS_CONNECTED) {
      throw new Error(
        `Calling registerSip is not allowed when sip status is ${this.state.infos[i].sipStatus} (expected ${SIP_STATUS_CONNECTED})`,
      );
    }
    return this.ua[i].register();
  };

  public unregisterSip = (i: number) => {
    if (this.props.autoRegister) {
      throw new Error(
        "Calling registerSip is not allowed when autoRegister === true",
      );
    }
    if (this.state.infos[i].sipStatus !== SIP_STATUS_REGISTERED) {
      throw new Error(
        `Calling unregisterSip is not allowed when sip status is ${this.state.infos[i].sipStatus} (expected ${SIP_STATUS_CONNECTED})`,
      );
    }
    return this.ua[i].unregister();
  };

  public answerCall = (i: number) => {
    if (
      this.state.infos[i].callStatus !== CALL_STATUS_STARTING ||
      this.state.infos[i].callDirection !== CALL_DIRECTION_INCOMING
    ) {
      throw new Error(
        `Calling answerCall() is not allowed when call status is ${this.state.infos[i].callStatus} and call direction is ${this.state.infos[i].callDirection}  (expected ${CALL_STATUS_STARTING} and ${CALL_DIRECTION_INCOMING})`,
      );
    }

    this.state.infos[i].rtcSession.answer({
      mediaConstraints: {
        audio: true,
        video: false,
      },
      pcConfig: {
        iceServers: this.props.iceServers,
      },
    });
  };

  public startCall = (destination: any, i: number) => {
    if (!destination) {
      throw new Error(`Destination must be defined (${destination} given)`);
    }
    if (
      this.state.infos[i].sipStatus !== SIP_STATUS_CONNECTED &&
      this.state.infos[i].sipStatus !== SIP_STATUS_REGISTERED
    ) {
      throw new Error(
        `Calling startCall() is not allowed when sip status is ${this.state.infos[i].sipStatus} (expected ${SIP_STATUS_CONNECTED} or ${SIP_STATUS_REGISTERED})`,
      );
    }

    if (this.state.infos[i].callStatus !== CALL_STATUS_IDLE) {
      throw new Error(
        `Calling startCall() is not allowed when call status is ${this.state.infos[i].callStatus} (expected ${CALL_STATUS_IDLE})`,
      );
    }

    const { iceServers, sessionTimersExpires } = this.props;
    const extraHeaders = this.props.extraHeaders.invite;

    const options = {
      extraHeaders,
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { iceRestart: this.props.iceRestart },
      pcConfig: {
        iceServers,
      },
      sessionTimersExpires,
    };

    this.ua[i].call(destination, options);
    this.setState((state) => {
      const infos = state.infos.map(
        (info: State, j): State => {
          if (j === i) {
            return {
              ...info,
              callStatus: CALL_STATUS_STARTING,
            };
          } else {
            return info;
          }
        },
      );
      return { infos };
    });
  };

  public stopCall = (i: number) => {
    this.setState((state) => {
      const infos = state.infos.map(
        (info: State, j): State => {
          if (j === i) {
            return {
              ...info,
              callStatus: CALL_STATUS_STOPPING,
            };
          } else {
            return info;
          }
        },
      );
      return { infos };
    });
    this.ua[i].terminateSessions();
  };

  public muteCall = (i: number) => {
    this.state.infos[i].rtcSession.mute();
  };

  public unmuteCall = (i: number) => {
    this.state.infos[i].rtcSession.unmute();
  };

  public holdCall = (i: number) => {
    this.state.infos[i].rtcSession.hold();
  };

  public unholdCall = (i: number) => {
    this.state.infos[i].rtcSession.unhold();
  };

  public sendDTMF = (dtmfnum: any, i: number) => {
    this.state.infos[i].rtcSession.sendDTMF(dtmfnum);
  };

  public reconfigureDebug() {
    const { debug } = this.props;

    if (debug) {
      JsSIP.debug.enable("JsSIP:*");
      this.logger = console;
    } else {
      JsSIP.debug.disable();
      this.logger = dummyLogger;
    }
  }

  public reinitializeJsSIP() {
    if (this.ua.length) {
      for (let i = 0; i < this.ua.length; i++) {
        if (!this.ua[i]) continue;
        this.ua[i].stop();
      }
      this.ua = [];
    }

    const { host, port, pathname, user, password, autoRegister } = this.props;

    for (let i = 0; i < this.count; i++) {
      if (!host[i] || !port || !user[i]) {
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_DISCONNECTED,
                  sipErrorType: null,
                  sipErrorMessage: null,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      }
    }

    for (let i = 0; i < this.count; i++) {
      try {
        const socket = new JsSIP.WebSocketInterface(
          `wss://${host[i]}:${port}${pathname}`,
        );
        const ua = new JsSIP.UA({
          uri: `sip:${user[i]}@${host[i]}`,
          password: password[i],
          sockets: [socket],
          register: autoRegister,
        });
        this.ua = [...this.ua, ua];
      } catch (error) {
        this.logger.debug("Error", error.message, error);
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_ERROR,
                  sipErrorType: SIP_ERROR_TYPE_CONFIGURATION,
                  sipErrorMessage: error.message,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
        this.ua = [...this.ua, null];
      }
    }

    const { ua } = this;

    for (let i = 0; i < ua.length; i++) {
      if (!ua[i]) continue;

      ua[i].on("connecting", () => {
        this.logger.debug('UA "connecting" event');
        if (this.ua[i] !== ua[i]) {
          return;
        }
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_CONNECTING,
                  sipErrorType: null,
                  sipErrorMessage: null,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      });

      ua[i].on("connected", () => {
        this.logger.debug('UA "connected" event');
        if (this.ua[i] !== ua[i]) {
          return;
        }
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_CONNECTED,
                  sipErrorType: null,
                  sipErrorMessage: null,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      });

      ua[i].on("disconnected", () => {
        this.logger.debug('UA "disconnected" event');
        if (this.ua[i] !== ua[i]) {
          return;
        }
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_ERROR,
                  sipErrorType: SIP_ERROR_TYPE_CONNECTION,
                  sipErrorMessage: "disconnected",
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      });

      ua[i].on("registered", (data: any) => {
        this.logger.debug('UA "registered" event', data);
        if (this.ua[i] !== ua[i]) {
          return;
        }
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_REGISTERED,
                  callStatus: CALL_STATUS_IDLE,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      });

      ua[i].on("unregistered", () => {
        this.logger.debug('UA "unregistered" event');
        if (this.ua[i] !== ua[i]) {
          return;
        }
        if (ua[i].isConnected()) {
          this.setState((state) => {
            const infos = state.infos.map(
              (info: State, j): State => {
                if (j === i) {
                  return {
                    ...info,
                    sipStatus: SIP_STATUS_CONNECTED,
                    callStatus: CALL_STATUS_IDLE,
                    callDirection: null,
                  };
                } else {
                  return info;
                }
              },
            );
            return { infos };
          });
        } else {
          this.setState((state) => {
            const infos = state.infos.map(
              (info: State, j): State => {
                if (j === i) {
                  return {
                    ...info,
                    sipStatus: SIP_STATUS_DISCONNECTED,
                    callStatus: CALL_STATUS_IDLE,
                    callDirection: null,
                  };
                } else {
                  return info;
                }
              },
            );
            return { infos };
          });
        }
      });

      ua[i].on("registrationFailed", (data: any) => {
        this.logger.debug('UA "registrationFailed" event');
        if (this.ua[i] !== ua[i]) {
          return;
        }
        this.setState((state) => {
          const infos = state.infos.map(
            (info: State, j): State => {
              if (j === i) {
                return {
                  ...info,
                  sipStatus: SIP_STATUS_ERROR,
                  sipErrorType: SIP_ERROR_TYPE_REGISTRATION,
                  sipErrorMessage: data,
                };
              } else {
                return info;
              }
            },
          );
          return { infos };
        });
      });

      ua[i].on(
        "newRTCSession",
        ({
          originator,
          session: rtcSession,
          request: rtcRequest,
        }: NewRTCSession) => {
          if (!this || this.ua[i] !== ua[i]) {
            return;
          }

          // identify call direction
          if (originator === "local") {
            const foundUri = rtcRequest.to.toString();
            const delimiterPosition = foundUri.indexOf(";") || null;
            this.setState((state) => {
              const infos = state.infos.map(
                (info: State, j): State => {
                  if (j === i) {
                    return {
                      ...info,
                      callDirection: CALL_DIRECTION_OUTGOING,
                      callStatus: CALL_STATUS_STARTING,
                      callCounterpart:
                        foundUri.substring(0, delimiterPosition) || foundUri,
                    };
                  } else {
                    return info;
                  }
                },
              );
              return { infos };
            });
          } else if (originator === "remote") {
            const foundUri = rtcRequest.from.toString();
            const delimiterPosition = foundUri.indexOf(";") || null;
            this.setState((state) => {
              const infos = state.infos.map(
                (info: State, j): State => {
                  if (j === i) {
                    return {
                      ...info,
                      callDirection: CALL_DIRECTION_INCOMING,
                      callStatus: CALL_STATUS_STARTING,
                      callCounterpart:
                        foundUri.substring(0, delimiterPosition) || foundUri,
                    };
                  } else {
                    return info;
                  }
                },
              );
              return { infos };
            });
          }

          const { infos } = this.state;
          const { rtcSession: rtcSessionInState } = infos[i];

          // Avoid if busy or other incoming
          if (rtcSessionInState) {
            this.logger.debug('incoming call replied with 486 "Busy Here"');
            rtcSession.terminate({
              status_code: 486,
              reason_phrase: "Busy Here",
            });
            return;
          }

          this.setState((state) => {
            const infos = state.infos.map(
              (info: State, j): State => {
                if (j === i) {
                  return {
                    ...info,
                    rtcSession,
                  };
                } else {
                  return info;
                }
              },
            );
            return { infos };
          });
          rtcSession.on("failed", () => {
            if (this.ua[i] !== ua[i]) {
              return;
            }

            this.setState((state) => {
              const infos = state.infos.map(
                (info: State, j): State => {
                  if (j === i) {
                    return {
                      ...info,
                      rtcSession: null,
                      callStatus: CALL_STATUS_IDLE,
                      callDirection: null,
                      callCounterpart: null,
                    };
                  } else {
                    return info;
                  }
                },
              );
              return { infos };
            });
          });

          rtcSession.on("ended", () => {
            if (this.ua[i] !== ua[i]) {
              return;
            }

            this.setState((state) => {
              const infos = state.infos.map(
                (info: State, j): State => {
                  if (j === i) {
                    return {
                      ...info,
                      rtcSession: null,
                      callStatus: CALL_STATUS_IDLE,
                      callDirection: null,
                      callCounterpart: null,
                    };
                  } else {
                    return info;
                  }
                },
              );
              return { infos };
            });
          });

          rtcSession.on("accepted", () => {
            if (this.ua[i] !== ua[i]) {
              return;
            }

            [
              this.remoteAudio.srcObject,
            ] = rtcSession.connection.getRemoteStreams();
            // const played = this.remoteAudio.play();
            const played = this.remoteAudio.play();

            if (typeof played !== "undefined") {
              played
                .catch(() => {
                  /**/
                })
                .then(() => {
                  setTimeout(() => {
                    this.remoteAudio.play();
                  }, 2000);
                });
              this.setState((state) => {
                const infos = state.infos.map(
                  (info: State, j): State => {
                    if (j === i) {
                      return {
                        ...info,
                        callStatus: CALL_STATUS_ACTIVE,
                      };
                    } else {
                      return info;
                    }
                  },
                );
                return { infos };
              });
              return;
            }

            setTimeout(() => {
              this.remoteAudio.play();
            }, 2000);

            this.setState((state) => {
              const infos = state.infos.map(
                (info: State, j): State => {
                  if (j === i) {
                    return {
                      ...info,
                      callStatus: CALL_STATUS_ACTIVE,
                    };
                  } else {
                    return info;
                  }
                },
              );
              return { infos };
            });
          });

          if (
            this.state.infos[i].callDirection === CALL_DIRECTION_INCOMING &&
            this.props.autoAnswer
          ) {
            this.logger.log("Answer auto ON");
            this.answerCall(i);
          } else if (
            this.state.infos[i].callDirection === CALL_DIRECTION_INCOMING &&
            !this.props.autoAnswer
          ) {
            this.logger.log("Answer auto OFF");
          } else if (
            this.state.infos[i].callDirection === CALL_DIRECTION_OUTGOING
          ) {
            this.logger.log("OUTGOING call");
          }
        },
      );

      const extraHeadersRegister = this.props.extraHeaders.register || [];
      if (extraHeadersRegister.length) {
        ua[i].registrator().setExtraHeaders(extraHeadersRegister);
      }
      ua[i].start();
    }
  }

  public render() {
    return this.props.children;
  }
}
