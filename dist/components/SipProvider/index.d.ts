import * as PropTypes from "prop-types";
import * as React from "react";
import { Props, State } from "../../lib/types";
export default class App extends React.Component<Props, {
    infos: State[];
}> {
    static childContextTypes: {
        users: PropTypes.Requireable<(PropTypes.InferProps<{
            sip: PropTypes.Requireable<PropTypes.InferProps<{
                status: PropTypes.Requireable<string>;
                errorType: PropTypes.Requireable<string>;
                errorMessage: PropTypes.Requireable<string>;
                host: PropTypes.Requireable<string>;
                port: PropTypes.Requireable<number>;
                user: PropTypes.Requireable<string>;
                password: PropTypes.Requireable<string>;
                autoRegister: PropTypes.Requireable<boolean>;
                autoAnswer: PropTypes.Requireable<boolean>;
                sessionTimersExpires: PropTypes.Requireable<number>;
                extraHeaders: PropTypes.Requireable<{
                    [x: string]: (string | null | undefined)[] | null | undefined;
                }>;
                iceServers: PropTypes.Requireable<(object | null | undefined)[]>;
                debug: PropTypes.Requireable<boolean>;
            }>>;
            call: PropTypes.Requireable<PropTypes.InferProps<{
                id: PropTypes.Requireable<string>;
                status: PropTypes.Requireable<string>;
                direction: PropTypes.Requireable<string>;
                counterpart: PropTypes.Requireable<string>;
            }>>;
        }> | null | undefined)[]>;
        registerSip: PropTypes.Requireable<(...args: any[]) => any>;
        unregisterSip: PropTypes.Requireable<(...args: any[]) => any>;
        answerCall: PropTypes.Requireable<(...args: any[]) => any>;
        startCall: PropTypes.Requireable<(...args: any[]) => any>;
        stopCall: PropTypes.Requireable<(...args: any[]) => any>;
        holdCall: PropTypes.Requireable<(...args: any[]) => any>;
        unholdCall: PropTypes.Requireable<(...args: any[]) => any>;
        muteCall: PropTypes.Requireable<(...args: any[]) => any>;
        unmuteCall: PropTypes.Requireable<(...args: any[]) => any>;
        sendDTMF: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static propTypes: {
        host: PropTypes.Requireable<(string | null | undefined)[]>;
        port: PropTypes.Requireable<number>;
        pathname: PropTypes.Requireable<string>;
        user: PropTypes.Requireable<(string | null | undefined)[]>;
        password: PropTypes.Requireable<(string | null | undefined)[]>;
        autoRegister: PropTypes.Requireable<boolean>;
        autoAnswer: PropTypes.Requireable<boolean>;
        iceRestart: PropTypes.Requireable<boolean>;
        sessionTimersExpires: PropTypes.Requireable<number>;
        extraHeaders: PropTypes.Requireable<{
            [x: string]: (string | null | undefined)[] | null | undefined;
        }>;
        iceServers: PropTypes.Requireable<(object | null | undefined)[]>;
        debug: PropTypes.Requireable<boolean>;
        children: PropTypes.Requireable<PropTypes.ReactNodeLike>;
    };
    static defaultProps: {
        host: never[];
        port: null;
        pathname: string;
        user: never[];
        password: never[];
        autoRegister: boolean;
        autoAnswer: boolean;
        iceRestart: boolean;
        sessionTimersExpires: number;
        extraHeaders: {
            register: never[];
            invite: never[];
        };
        iceServers: never[];
        debug: boolean;
        children: null;
    };
    private ua;
    private remoteAudio;
    private logger;
    private count;
    constructor(props: Props);
    getChildContext(): {
        users: any[];
        registerSip: (i: number) => any;
        unregisterSip: (i: number) => any;
        answerCall: (i: number) => void;
        startCall: (destination: any, i: number) => void;
        stopCall: (i: number) => void;
        holdCall: (i: number) => void;
        unholdCall: (i: number) => void;
        muteCall: (i: number) => void;
        unmuteCall: (i: number) => void;
        sendDTMF: (dtmfnum: any, i: number) => void;
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: Props): void;
    componentWillUnmount(): void;
    registerSip: (i: number) => any;
    unregisterSip: (i: number) => any;
    answerCall: (i: number) => void;
    startCall: (destination: any, i: number) => void;
    stopCall: (i: number) => void;
    muteCall: (i: number) => void;
    unmuteCall: (i: number) => void;
    holdCall: (i: number) => void;
    unholdCall: (i: number) => void;
    sendDTMF: (dtmfnum: any, i: number) => void;
    reconfigureDebug(): void;
    reinitializeJsSIP(): void;
    render(): React.ReactNode;
}
