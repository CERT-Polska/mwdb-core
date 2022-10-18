import React, {useCallback, useEffect, useMemo, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../api";

import { Capability } from "./capabilities";
import { AuthContext } from "./context";

const LOCAL_STORAGE_KEY = "user";

function isSessionValid(authSession) {
    if (!authSession || !authSession.token) {
        // Token is missing
        console.warn("Session invalid: 'token' has not been found in session data")
        return false;
    }
    if (
        JSON.parse(atob(authSession.token.split(".")[0])).exp <=
        new Date() / 1000
    ) {
        // Token expired
        console.warn("Session invalid: 'token' expired")
        return false;
    }
    if (!authSession.login || !authSession.groups || !authSession.capabilities) {
        // Missing other required auth information
        console.warn("Session invalid: 'token' is valid but other information are missing")
        return false;
    }
    return true;
}

function getSessionFromStorage() {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if(!storedData)
        return null;
    try {
        const sessionData = JSON.parse(storedData);
        if(!isSessionValid(sessionData))
            return null;
        return sessionData;
    } catch(e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
    }
}

function putSessionToStorage(sessionData) {
    if (!sessionData) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return false;
    }
    if(!isSessionValid(sessionData)) {
        return false;
    }
    localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(sessionData)
    );
    return true;
}

function setTokenForAPI(token) {
    api.axios.defaults.headers.common["Authorization"] = token
        ? "Bearer " + token
        : null;
}

function useSession() {
    /**
     * Hook for session data
     * - gets initial state from local storage
     * - every state change is synchronized with Axios Authorization header
     **/
    const [sessionState, setSessionState] = useState(
        () => {
            const session = getSessionFromStorage();
            if(session)
                setTokenForAPI(session.token);
            return session;
        }
    )
    const setSession = useCallback((newSession) => {
        setSessionState(() => {
            setTokenForAPI(newSession && newSession.token);
            return newSession;
        })
    }, []);
    // Synchronize session in another tab with changed local session state
    useEffect(() => {
        function synchronizeSessionState() {
            const storedSession = getSessionFromStorage();
            setSession(storedSession);
        }
        window.addEventListener("storage", synchronizeSessionState);
        return () => {
            window.removeEventListener("storage", synchronizeSessionState);
        };
    }, [setSession]);
    return [sessionState, setSession]
}

export function AuthProvider({children}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [session, setSession] = useSession();
    const isAuthenticated = !!session;
    const { login, groups, capabilities } = session || {};

    const updateSession = useCallback((newSession) => {
        // Updates local session state
        // To be used by UserLogin and other authentication frontends
        if (newSession && !isSessionValid(newSession))
            throw new Error("Provided session state is not valid");
        // Update session state
        setSession(newSession);
        // Store new session data in local storage and notify other windows about change
        putSessionToStorage(newSession);
    }, [setSession]);

    const refreshSession = useCallback(() => {
        async function doRefreshSession() {
            try {
                // If not authenticated: just ignore that call
                // refreshSession is called by 403 Forbidden interceptor
                if (!isAuthenticated) return;
                const response = await api.authRefresh();
                updateSession(response.data);
            } catch (e) {
                // It may fail due to short-lasting network problems.
                // Just log it and try again later.
                console.error(e);
            }
        }
        doRefreshSession();
    }, [isAuthenticated, updateSession]);

    const logout = useCallback((error) => {
        // Clears session state and redirects user to the UserLogin page
        const logoutReason = error
            ? { error }
            : { success: "User logged out successfully." };
        updateSession(null);
        navigate("/login", {
            state: {
                prevLocation: location,
                ...logoutReason,
            },
        });
    }, [updateSession, navigate, location]);

    const hasCapability = useCallback((capability) => {
        return capabilities && capabilities.indexOf(capability) >= 0;
    }, [capabilities]);

    // Effect for 401 Not authenticated to handle unexpected session expiration
    useEffect(() => {
        // Set 401 Not Authenticated interceptor when AuthProvider is mounted
        const interceptor = api.axios.interceptors.response.use(
            (_) => _,
            (error) => {
                // Logout on 401
                if (error.response && error.response.status === 401)
                    logout(
                        "Session expired. Please authenticate before accessing this page."
                    );
                return Promise.reject(error);
            }
        );

        // Unset the interceptor when AuthProvider is unmounted
        return () => {
            api.axios.interceptors.response.eject(interceptor);
        };
    }, [logout]);

    // Effect for 403 Forbidden to handle unexpected loss of permissions
    useEffect(() => {
        // Set 403 Forbidden interceptor when AuthProvider is mounted
        const interceptor = api.axios.interceptors.response.use(
            (_) => _,
            (error) => {
                // Asynchronically refresh session with 403 expecting new set of capabilities
                if (error.response && error.response.status === 403)
                    refreshSession();
                return Promise.reject(error);
            }
        );

        // Unset the interceptor when AuthProvider is unmounted
        return () => {
            api.axios.interceptors.response.eject(interceptor);
        };
    }, [refreshSession]);

    // Effect for periodic session refresh
    useEffect(() => {
        if(!isAuthenticated)
            return;
        const refreshTimer = setInterval(refreshSession, 1000);
        // Perform initial session refresh immediately
        refreshSession();
        return () => {
            clearInterval(refreshTimer);
        }
    }, [isAuthenticated, refreshSession]);

    const providerValue = useMemo(() => {
        console.log("Changed value")
        return {
            user: {login, groups, capabilities},
            isAuthenticated,
            isAdmin: hasCapability(Capability.manageUsers),
            hasCapability,
            refreshSession,
            updateSession,
            logout,
        }
    }, [login, groups, capabilities, isAuthenticated, hasCapability, refreshSession, updateSession, logout])

    return (
        <AuthContext.Provider
            value={providerValue}
        >
            {children}
        </AuthContext.Provider>
    );
}
