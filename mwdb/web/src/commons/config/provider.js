import React, { useState, useEffect, useReducer } from "react";
import api from "../api";
import { ConfigContext } from "./context";

const configUpdate = Symbol("configUpdate");
const configError = Symbol("configError");

function serverConfigReducer(state, action) {
    switch (action.type) {
        case configUpdate:
            return { config: action.config, error: null };
        case configError:
            return { config: null, error: action.error };
        default:
            return state;
    }
}

export function ConfigProvider(props) {
    const [serverConfig, setServerConfig] = useReducer(serverConfigReducer, {
        config: null,
        error: null,
    });

    const [remote, setRemote] = useState("");

    async function update() {
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

    useEffect(() => {
        update();
    }, []);

    return (
        <ConfigContext.Provider
            value={{
                config: serverConfig.config,
                configError: serverConfig.error,
                remote: remote,
                update,
                setRemote,
            }}
        >
            {props.children}
        </ConfigContext.Provider>
    );
}
