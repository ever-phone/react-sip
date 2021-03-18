"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var JsSIP = require("jssip");
var PropTypes = require("prop-types");
var React = require("react");
var dummyLogger_1 = require("../../lib/dummyLogger");
var enums_1 = require("../../lib/enums");
var types_1 = require("../../lib/types");
var App = (function (_super) {
    __extends(App, _super);
    function App(props) {
        var _this = _super.call(this, props) || this;
        _this.registerSip = function (i) {
            if (_this.props.autoRegister) {
                throw new Error("Calling registerSip is not allowed when autoRegister === true");
            }
            if (_this.state.infos[i].sipStatus !== enums_1.SIP_STATUS_CONNECTED) {
                throw new Error("Calling registerSip is not allowed when sip status is " + _this.state.infos[i].sipStatus + " (expected " + enums_1.SIP_STATUS_CONNECTED + ")");
            }
            return _this.ua[i].register();
        };
        _this.unregisterSip = function (i) {
            if (_this.props.autoRegister) {
                throw new Error("Calling registerSip is not allowed when autoRegister === true");
            }
            if (_this.state.infos[i].sipStatus !== enums_1.SIP_STATUS_REGISTERED) {
                throw new Error("Calling unregisterSip is not allowed when sip status is " + _this.state.infos[i].sipStatus + " (expected " + enums_1.SIP_STATUS_CONNECTED + ")");
            }
            return _this.ua[i].unregister();
        };
        _this.answerCall = function (i) {
            if (_this.state.infos[i].callStatus !== enums_1.CALL_STATUS_STARTING ||
                _this.state.infos[i].callDirection !== enums_1.CALL_DIRECTION_INCOMING) {
                throw new Error("Calling answerCall() is not allowed when call status is " + _this.state.infos[i].callStatus + " and call direction is " + _this.state.infos[i].callDirection + "  (expected " + enums_1.CALL_STATUS_STARTING + " and " + enums_1.CALL_DIRECTION_INCOMING + ")");
            }
            _this.state.infos[i].rtcSession.answer({
                mediaConstraints: {
                    audio: true,
                    video: false,
                },
                pcConfig: {
                    iceServers: _this.props.iceServers,
                },
            });
        };
        _this.startCall = function (destination, i) {
            if (!destination) {
                throw new Error("Destination must be defined (" + destination + " given)");
            }
            if (_this.state.infos[i].sipStatus !== enums_1.SIP_STATUS_CONNECTED &&
                _this.state.infos[i].sipStatus !== enums_1.SIP_STATUS_REGISTERED) {
                throw new Error("Calling startCall() is not allowed when sip status is " + _this.state.infos[i].sipStatus + " (expected " + enums_1.SIP_STATUS_CONNECTED + " or " + enums_1.SIP_STATUS_REGISTERED + ")");
            }
            if (_this.state.infos[i].callStatus !== enums_1.CALL_STATUS_IDLE) {
                throw new Error("Calling startCall() is not allowed when call status is " + _this.state.infos[i].callStatus + " (expected " + enums_1.CALL_STATUS_IDLE + ")");
            }
            var _a = _this.props, iceServers = _a.iceServers, sessionTimersExpires = _a.sessionTimersExpires;
            var extraHeaders = _this.props.extraHeaders.invite;
            var options = {
                extraHeaders: extraHeaders,
                mediaConstraints: { audio: true, video: false },
                rtcOfferConstraints: { iceRestart: _this.props.iceRestart },
                pcConfig: {
                    iceServers: iceServers,
                },
                sessionTimersExpires: sessionTimersExpires,
            };
            _this.ua[i].call(destination, options);
            _this.setState(function (state) {
                var infos = state.infos.map(function (info, j) {
                    if (j === i) {
                        return __assign(__assign({}, info), { callStatus: enums_1.CALL_STATUS_STARTING });
                    }
                    else {
                        return info;
                    }
                });
                return { infos: infos };
            });
        };
        _this.stopCall = function (i) {
            _this.setState(function (state) {
                var infos = state.infos.map(function (info, j) {
                    if (j === i) {
                        return __assign(__assign({}, info), { callStatus: enums_1.CALL_STATUS_STOPPING });
                    }
                    else {
                        return info;
                    }
                });
                return { infos: infos };
            });
            _this.ua[i].terminateSessions();
        };
        _this.muteCall = function (i) {
            _this.state.infos[i].rtcSession.mute();
        };
        _this.unmuteCall = function (i) {
            _this.state.infos[i].rtcSession.unmute();
        };
        _this.holdCall = function (i) {
            _this.state.infos[i].rtcSession.hold();
        };
        _this.unholdCall = function (i) {
            _this.state.infos[i].rtcSession.unhold();
        };
        _this.sendDTMF = function (dtmfnum, i) {
            _this.state.infos[i].rtcSession.sendDTMF(dtmfnum);
        };
        _this.ua = [];
        _this.state = { infos: [] };
        _this.count = 0;
        return _this;
    }
    App.prototype.getChildContext = function () {
        var users = [];
        for (var i = 0; i < this.count; i++) {
            var tmp = {
                sip: __assign(__assign({}, this.props), { host: this.props.host[i], user: this.props.user[i], password: this.props.password[i], status: this.state.infos[i].sipStatus, errorType: this.state.infos[i].sipErrorType, errorMessage: this.state.infos[i].sipErrorMessage }),
                call: {
                    id: "??",
                    status: this.state.infos[i].callStatus,
                    direction: this.state.infos[i].callDirection,
                    counterpart: this.state.infos[i].callCounterpart,
                },
            };
            users = __spreadArrays(users, [tmp]);
        }
        return {
            users: users,
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
    };
    App.prototype.componentDidMount = function () {
        if (window.document.getElementById("sip-provider-audio")) {
            throw new Error("Creating two SipProviders in one application is forbidden. If that's not the case " +
                "then check if you're using \"sip-provider-audio\" as id attribute for any existing " +
                "element");
        }
        this.remoteAudio = window.document.createElement("audio");
        this.remoteAudio.id = "sip-provider-audio";
        window.document.body.appendChild(this.remoteAudio);
        var length = [
            this.props.host.length,
            this.props.user.length,
            this.props.password.length,
        ];
        if (Array.from(new Set(length))[1]) {
            throw new Error("There is a problem with the Props value ");
        }
        this.count = this.props.host.length;
        var tmp = {
            sipStatus: enums_1.SIP_STATUS_DISCONNECTED,
            sipErrorType: null,
            sipErrorMessage: null,
            rtcSession: null,
            callStatus: enums_1.CALL_STATUS_IDLE,
            callDirection: null,
            callCounterpart: null,
        };
        for (var i = 0; i < this.count; i++) {
            this.setState(function (state) {
                var infos = __spreadArrays(state.infos, [tmp]);
                return { infos: infos };
            });
        }
        this.reconfigureDebug();
        this.reinitializeJsSIP();
    };
    App.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.debug !== prevProps.debug) {
            this.reconfigureDebug();
        }
        if (this.props.host !== prevProps.host ||
            this.props.port !== prevProps.port ||
            this.props.pathname !== prevProps.pathname ||
            this.props.user !== prevProps.user ||
            this.props.password !== prevProps.password ||
            this.props.autoRegister !== prevProps.autoRegister) {
            this.reinitializeJsSIP();
        }
    };
    App.prototype.componentWillUnmount = function () {
        this.remoteAudio.parentNode.removeChild(this.remoteAudio);
        delete this.remoteAudio;
        if (this.ua.length) {
            for (var i = 0; i < this.ua.length; i++) {
                if (!this.ua[i])
                    continue;
                this.ua[i].stop();
            }
            this.ua = [];
        }
    };
    App.prototype.reconfigureDebug = function () {
        var debug = this.props.debug;
        if (debug) {
            JsSIP.debug.enable("JsSIP:*");
            this.logger = console;
        }
        else {
            JsSIP.debug.disable();
            this.logger = dummyLogger_1.default;
        }
    };
    App.prototype.reinitializeJsSIP = function () {
        var _this = this;
        if (this.ua.length) {
            for (var i = 0; i < this.ua.length; i++) {
                this.ua[i].stop();
            }
            this.ua = [];
        }
        var _a = this.props, host = _a.host, port = _a.port, pathname = _a.pathname, user = _a.user, password = _a.password, autoRegister = _a.autoRegister;
        var _loop_1 = function (i) {
            if (!host[i] || !port || !user[i]) {
                this_1.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_DISCONNECTED, sipErrorType: null, sipErrorMessage: null });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
                return { value: void 0 };
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.count; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        var _loop_2 = function (i) {
            try {
                var socket = new JsSIP.WebSocketInterface("wss://" + host[i] + ":" + port + pathname);
                var ua_1 = new JsSIP.UA({
                    uri: "sip:" + user[i] + "@" + host[i],
                    password: password[i],
                    sockets: [socket],
                    register: autoRegister,
                });
                this_2.ua = __spreadArrays(this_2.ua, [ua_1]);
            }
            catch (error) {
                this_2.logger.debug("Error", error.message, error);
                this_2.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_ERROR, sipErrorType: enums_1.SIP_ERROR_TYPE_CONFIGURATION, sipErrorMessage: error.message });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
                this_2.ua = __spreadArrays(this_2.ua, [null]);
            }
        };
        var this_2 = this;
        for (var i = 0; i < this.count; i++) {
            _loop_2(i);
        }
        var ua = this.ua;
        var _loop_3 = function (i) {
            if (!ua[i])
                return "continue";
            ua[i].on("connecting", function () {
                _this.logger.debug('UA "connecting" event');
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_CONNECTING, sipErrorType: null, sipErrorMessage: null });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
            });
            ua[i].on("connected", function () {
                _this.logger.debug('UA "connected" event');
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_CONNECTED, sipErrorType: null, sipErrorMessage: null });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
            });
            ua[i].on("disconnected", function () {
                _this.logger.debug('UA "disconnected" event');
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_ERROR, sipErrorType: enums_1.SIP_ERROR_TYPE_CONNECTION, sipErrorMessage: "disconnected" });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
            });
            ua[i].on("registered", function (data) {
                _this.logger.debug('UA "registered" event', data);
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_REGISTERED, callStatus: enums_1.CALL_STATUS_IDLE });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
            });
            ua[i].on("unregistered", function () {
                _this.logger.debug('UA "unregistered" event');
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                if (ua[i].isConnected()) {
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_CONNECTED, callStatus: enums_1.CALL_STATUS_IDLE, callDirection: null });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                }
                else {
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_DISCONNECTED, callStatus: enums_1.CALL_STATUS_IDLE, callDirection: null });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                }
            });
            ua[i].on("registrationFailed", function (data) {
                _this.logger.debug('UA "registrationFailed" event');
                if (_this.ua[i] !== ua[i]) {
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { sipStatus: enums_1.SIP_STATUS_ERROR, sipErrorType: enums_1.SIP_ERROR_TYPE_REGISTRATION, sipErrorMessage: data });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
            });
            ua[i].on("newRTCSession", function (_a) {
                var originator = _a.originator, rtcSession = _a.session, rtcRequest = _a.request;
                if (!_this || _this.ua[i] !== ua[i]) {
                    return;
                }
                if (originator === "local") {
                    var foundUri_1 = rtcRequest.to.toString();
                    var delimiterPosition_1 = foundUri_1.indexOf(";") || null;
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { callDirection: enums_1.CALL_DIRECTION_OUTGOING, callStatus: enums_1.CALL_STATUS_STARTING, callCounterpart: foundUri_1.substring(0, delimiterPosition_1) || foundUri_1 });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                }
                else if (originator === "remote") {
                    var foundUri_2 = rtcRequest.from.toString();
                    var delimiterPosition_2 = foundUri_2.indexOf(";") || null;
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { callDirection: enums_1.CALL_DIRECTION_INCOMING, callStatus: enums_1.CALL_STATUS_STARTING, callCounterpart: foundUri_2.substring(0, delimiterPosition_2) || foundUri_2 });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                }
                var infos = _this.state.infos;
                var rtcSessionInState = infos[i].rtcSession;
                if (rtcSessionInState) {
                    _this.logger.debug('incoming call replied with 486 "Busy Here"');
                    rtcSession.terminate({
                        status_code: 486,
                        reason_phrase: "Busy Here",
                    });
                    return;
                }
                _this.setState(function (state) {
                    var infos = state.infos.map(function (info, j) {
                        if (j === i) {
                            return __assign(__assign({}, info), { rtcSession: rtcSession });
                        }
                        else {
                            return info;
                        }
                    });
                    return { infos: infos };
                });
                rtcSession.on("failed", function () {
                    if (_this.ua[i] !== ua[i]) {
                        return;
                    }
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { rtcSession: null, callStatus: enums_1.CALL_STATUS_IDLE, callDirection: null, callCounterpart: null });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                });
                rtcSession.on("ended", function () {
                    if (_this.ua[i] !== ua[i]) {
                        return;
                    }
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { rtcSession: null, callStatus: enums_1.CALL_STATUS_IDLE, callDirection: null, callCounterpart: null });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                });
                rtcSession.on("accepted", function () {
                    if (_this.ua[i] !== ua[i]) {
                        return;
                    }
                    _this.remoteAudio.srcObject = rtcSession.connection.getRemoteStreams()[0];
                    var played = _this.remoteAudio.play();
                    if (typeof played !== "undefined") {
                        played
                            .catch(function () {
                        })
                            .then(function () {
                            setTimeout(function () {
                                _this.remoteAudio.play();
                            }, 2000);
                        });
                        _this.setState(function (state) {
                            var infos = state.infos.map(function (info, j) {
                                if (j === i) {
                                    return __assign(__assign({}, info), { callStatus: enums_1.CALL_STATUS_ACTIVE });
                                }
                                else {
                                    return info;
                                }
                            });
                            return { infos: infos };
                        });
                        return;
                    }
                    setTimeout(function () {
                        _this.remoteAudio.play();
                    }, 2000);
                    _this.setState(function (state) {
                        var infos = state.infos.map(function (info, j) {
                            if (j === i) {
                                return __assign(__assign({}, info), { callStatus: enums_1.CALL_STATUS_ACTIVE });
                            }
                            else {
                                return info;
                            }
                        });
                        return { infos: infos };
                    });
                });
                if (_this.state.infos[i].callDirection === enums_1.CALL_DIRECTION_INCOMING &&
                    _this.props.autoAnswer) {
                    _this.logger.log("Answer auto ON");
                    _this.answerCall(i);
                }
                else if (_this.state.infos[i].callDirection === enums_1.CALL_DIRECTION_INCOMING &&
                    !_this.props.autoAnswer) {
                    _this.logger.log("Answer auto OFF");
                }
                else if (_this.state.infos[i].callDirection === enums_1.CALL_DIRECTION_OUTGOING) {
                    _this.logger.log("OUTGOING call");
                }
            });
            var extraHeadersRegister = this_3.props.extraHeaders.register || [];
            if (extraHeadersRegister.length) {
                ua[i].registrator().setExtraHeaders(extraHeadersRegister);
            }
            ua[i].start();
        };
        var this_3 = this;
        for (var i = 0; i < ua.length; i++) {
            _loop_3(i);
        }
    };
    App.prototype.render = function () {
        return this.props.children;
    };
    App.childContextTypes = {
        users: PropTypes.arrayOf(PropTypes.shape({ sip: types_1.sipPropType, call: types_1.callPropType })),
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
    App.propTypes = {
        host: PropTypes.arrayOf(PropTypes.string),
        port: PropTypes.number,
        pathname: PropTypes.string,
        user: PropTypes.arrayOf(PropTypes.string),
        password: PropTypes.arrayOf(PropTypes.string),
        autoRegister: PropTypes.bool,
        autoAnswer: PropTypes.bool,
        iceRestart: PropTypes.bool,
        sessionTimersExpires: PropTypes.number,
        extraHeaders: types_1.extraHeadersPropType,
        iceServers: types_1.iceServersPropType,
        debug: PropTypes.bool,
        children: PropTypes.node,
    };
    App.defaultProps = {
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
    return App;
}(React.Component));
exports.default = App;
//# sourceMappingURL=index.js.map