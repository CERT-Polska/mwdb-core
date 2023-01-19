import React, {
    useState,
    useContext,
    useEffect,
    useReducer,
    useCallback,
} from "react";
import api from "../api";
import { ConfigContext } from "./context";
import { AuthContext } from "../auth";

const configUpdate = Symbol("configUpdate");
const configError = Symbol("configError");

function serverConfigReducer(state, action) {
    switch (action.type) {
        case configUpdate:
            return {
                config: { ...state.config, ...action.config },
                error: null,
            };
        case configError:
            return { config: state.config, error: action.error };
        default:
            return state;
    }
}

export function ConfigProvider(props) {
    const auth = useContext(AuthContext);
    const [serverConfig, setServerConfig] = useReducer(serverConfigReducer, {
        config: {},
        error: null,
    });
    const [pendingUsers, setPendingUsers] = useState([]);

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
                error,
            });
        }
    }

    async function updatePendingUsers() {
        try {
            const response = await api.getPendingUsers();
            setPendingUsers(response.data["users"]);
        } catch (error) {
            setServerConfig({
                type: configError,
                error,
            });
        }
    }

    const getPendingUsers = useCallback(updatePendingUsers, []);

    useEffect(() => {
        updateServerInfo();
    }, []);

    useEffect(() => {
        if (auth.isAuthenticated) updateRemoteInfo();
    }, [auth.isAuthenticated]);

    useEffect(() => {
        if (Number.isInteger(serverConfig.config["request_timeout"])) {
            api.axios.defaults.timeout = serverConfig.config["request_timeout"];
        }
    }, [serverConfig]);

    useEffect(() => {
        if (
            auth.isAuthenticated &&
            auth.isAdmin &&
            serverConfig.config["is_registration_enabled"]
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

    return (
        <ConfigContext.Provider
            value={{
                config: serverConfig.config,
                configError: serverConfig.error,
                isReady: !!serverConfig.config["server_version"],
                update: updateServerInfo,
                pendingUsers: pendingUsers,
                getPendingUsers: getPendingUsers,
            }}
        >
            {props.children}
        </ConfigContext.Provider>
    );
}
