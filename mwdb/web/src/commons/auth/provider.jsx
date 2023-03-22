import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../api";

import { Capability } from "./capabilities";
import { AuthContext } from "./context";

export const localStorageAuthKey = "user";

function isSessionValid(authSession) {
    if (!authSession || !authSession.token)
        // Token is missing
        return false;
    if (
        JSON.parse(atob(authSession.token.split(".")[0])).exp <=
        new Date() / 1000
    )
        // Token expired
        return false;
    if (!authSession.login || !authSession.groups || !authSession.capabilities)
        // Missing other required auth informations
        return false;
    return true;
}

function getStoredAuthSession() {
    try {
        const sessionData = localStorage.getItem(localStorageAuthKey);
        if (!sessionData) return null;
        const storedAuthSession = JSON.parse(sessionData);
        if (!isSessionValid(storedAuthSession))
            throw new Error("Invalid session data");
        return storedAuthSession;
    } catch (e) {
        console.error(e);
        localStorage.removeItem(localStorageAuthKey);
        return null;
    }
}

function setTokenForAPI(token) {
    api.axios.defaults.headers.common["Authorization"] = token
        ? "Bearer " + token
        : null;
}

function useAxiosEffect(func) {
    /***
     * This is special kind of effect that runs *before* render (like componentWillMount).
     * In the same time, it keeps the original useEffect's clean-up behavior.
     *
     * It's required to do proper Axios setup (side-effect) before children are rendered
     * to prevent premature API requests before the auth token is recovered from localStorage.
     */
    const cleanup = useRef(null);

    if (cleanup.current === null) {
        // Run on first render and set the cleanup callback
        cleanup.current = func() || (() => {});
    }

    // Setup useEffect to cleanup the effect on unmount
    useEffect(() => {
        return () => {
            if (cleanup.current) cleanup.current();
        };
    }, []);
}

export function AuthProvider(props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [session, _setSession] = useState(getStoredAuthSession());
    const refreshTimer = useRef(null);
    const isAuthenticated = !!session;

    function setSession(newSession) {
        // Internal session setter which updates token used by Axios
        // before populating new state to the components
        _setSession(() => {
            setTokenForAPI(newSession && newSession.token);
            return newSession;
        });
    }

    function updateSession(newSession) {
        // Updates local session state
        // To be used by UserLogin and other authentication frontends
        if (newSession && !isSessionValid(newSession))
            throw new Error("Provided session state is not valid");
        // Store new session data and notify other windows about change
        if (newSession)
            localStorage.setItem(
                localStorageAuthKey,
                JSON.stringify(newSession)
            );
        else localStorage.removeItem(localStorageAuthKey);
        // Update session state
        setSession(newSession);
    }

    async function refreshSession() {
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

    async function oAuthLogout() {
        try {
            let response = await api.oauthGetLogoutLink(session.provider);
            window.location.href = response.data.url;
            return null;
        } catch (e) {
            console.log(e);
            return e.response.data.message;
        }
    }

    function logout(error) {
        // Clears session state and redirects user to the UserLogin page
        let logoutReason = error
            ? { error }
            : { success: "User logged out successfully." };
        updateSession(null);
        navigate("/login", {
            state: {
                prevLocation: location,
                ...logoutReason,
            },
        });
    }

    function hasCapability(capability) {
        return isAuthenticated && session.capabilities.indexOf(capability) >= 0;
    }

    // Effect for 401 Not authenticated to handle unexpected session expiration
    useAxiosEffect(() => {
        // Initialize Authorization header on mount
        setTokenForAPI(isAuthenticated && session.token);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    // Effect for 403 Forbidden to handle unexpected loss of permissions
    useAxiosEffect(() => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    // Effect for periodic session refresh
    useEffect(() => {
        function setRefreshTimer() {
            if (refreshTimer.current) return;
            refreshTimer.current = setInterval(refreshSession, 60000);
            refreshSession();
        }

        function clearRefreshTimer() {
            if (!refreshTimer.current) return;
            clearInterval(refreshTimer.current);
            refreshTimer.current = null;
        }

        // Set timer if user is logged in, clear otherwise
        (isAuthenticated ? setRefreshTimer : clearRefreshTimer)();
        return clearRefreshTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // Synchronize session in another window with local session state
    useEffect(() => {
        function synchronizeSessionState() {
            const storedSession = getStoredAuthSession();
            setSession(storedSession);
        }
        window.addEventListener("storage", synchronizeSessionState);
        return () => {
            window.removeEventListener("storage", synchronizeSessionState);
        };
    }, []);

    const value = useMemo(
        () => ({
            user: session,
            isAuthenticated: !!session,
            isAdmin: hasCapability(Capability.manageUsers),
            hasCapability,
            refreshSession,
            updateSession,
            logout,
            oAuthLogout,
        }),
        [session, Capability]
    );

    return (
        <AuthContext.Provider value={value}>
            {props.children}
        </AuthContext.Provider>
    );
}
