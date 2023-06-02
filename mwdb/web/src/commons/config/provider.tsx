import {
    useState,
    useContext,
    useEffect,
    useReducer,
    useCallback,
    Reducer,
} from "react";
import { isEqual } from "lodash";
import { api } from "../api";
import { ConfigContext } from "./context";
import { AuthContext } from "../auth";
import { ServerInfo, User } from "@mwdb-web/types/types";
import { ConfigContextValues } from "@mwdb-web/types/context";

const configUpdate = Symbol("configUpdate");
const configError = Symbol("configError");

type ServerConfigReducerState = {
    config: Partial<ServerInfo>;
    error?: Error | unknown;
};

type ServerConfigReducerAction = {
    type: typeof configUpdate | typeof configError;
    config: Partial<ServerInfo>;
    error?: Error | unknown;
};

function serverConfigReducer(
    state: ServerConfigReducerState,
    action: ServerConfigReducerAction
) {
    switch (action.type) {
        case configUpdate:
            return {
                config: { ...state.config, ...action.config },
                error: undefined,
            };
        case configError:
            return { config: state.config, error: action.error };
        default:
            return state;
    }
}

type Props = {
    children: JSX.Element;
};

export function ConfigProvider(props: Props) {
    const auth = useContext(AuthContext);
    const [serverConfig, setServerConfig] = useReducer<
        Reducer<ServerConfigReducerState, ServerConfigReducerAction>
    >(serverConfigReducer, {
        config: {},
    });
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);

    async function updateServerInfo() {
        try {
            const response = await api.getServerInfo();
            setServerConfig({
                type: configUpdate,
                config: response.data,
            });
        } catch (error) {
            setServerConfig({
                type: configError,
                config: {},
                error,
            });
        }
    }

    async function updateRemoteInfo() {
        try {
            const response = await api.getRemoteNames();
            setServerConfig({
                type: configUpdate,
                config: {
                    remotes: response.data.remotes,
                },
            });
        } catch (error) {
            setServerConfig({
                type: configError,
                config: {},
                error,
            });
        }
    }

    async function updatePendingUsers() {
        try {
            const response = await api.getPendingUsers();
            const users = response.data.users;
            if (!isEqual(users, pendingUsers)) {
                setPendingUsers(users);
            }
        } catch (error) {
            setServerConfig({
                type: configError,
                config: {},
                error,
            });
        }
    }

    const getPendingUsers = useCallback(updatePendingUsers, [pendingUsers]);

    useEffect(() => {
        updateServerInfo();
    }, []);

    useEffect(() => {
        if (auth.isAuthenticated) updateRemoteInfo();
    }, [auth.isAuthenticated]);

    useEffect(() => {
        if (
            serverConfig.config &&
            Number.isInteger(serverConfig.config.request_timeout)
        ) {
            api.axios.defaults.timeout = serverConfig.config["request_timeout"];
        }
    }, [serverConfig]);

    useEffect(() => {
        if (
            serverConfig.config &&
            auth.isAuthenticated &&
            auth.isAdmin &&
            serverConfig.config.is_registration_enabled
        ) {
            let timer = setInterval(getPendingUsers, 15000);
            getPendingUsers();
            return () => {
                clearInterval(timer);
            };
        }
    }, [
        auth.isAuthenticated,
        auth.isAdmin,
        serverConfig.config,
        getPendingUsers,
    ]);

    const values: ConfigContextValues = {
        config: serverConfig.config,
        configError: serverConfig.error,
        isReady: !!serverConfig.config?.server_version,
        update: updateServerInfo,
        pendingUsers: pendingUsers,
        getPendingUsers: getPendingUsers,
    };

    return (
        <ConfigContext.Provider value={values}>
            {props.children}
        </ConfigContext.Provider>
    );
}
