import React, { useContext, useEffect, useReducer } from "react";
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

    useEffect(() => {
        updateServerInfo();
    }, []);

    useEffect(() => {
        if (auth.isAuthenticated) updateRemoteInfo();
    }, [auth.isAuthenticated]);

    return (
        <ConfigContext.Provider
            value={{
                config: serverConfig.config,
                configError: serverConfig.error,
                update: updateServerInfo,
            }}
        >
            {props.children}
        </ConfigContext.Provider>
    );
}
