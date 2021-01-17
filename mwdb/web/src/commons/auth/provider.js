import React, { useEffect, useRef, useState } from "react";
import { useHistory } from 'react-router';

import api from "../api";

import { AuthContext } from "./context";

const localStorageAuthKey = "user"

function isSessionValid(authSession) {
    if(!authSession || !authSession.token)
        // Token is missing
        return false;
    if(JSON.parse(atob(authSession.token.split(".")[0])).exp <= new Date() / 1000)
        // Token expired
        return false;
    if(!authSession.login || !authSession.groups || !authSession.capabilities)
        // Missing other required auth informations
        return false;
    return true;
}

function getStoredAuthSession() {
    const storedAuthSession = JSON.parse(
        localStorage.getItem(localStorageAuthKey)
    );
    if(!isSessionValid(storedAuthSession)) {
        localStorage.removeItem(localStorageAuthKey);
        return null;
    }
    return storedAuthSession;
}

function setTokenForAPI(token)
{
    api.axios.defaults.headers.common['Authorization'] = (
        token ? ('Bearer ' + token) : null
    );
}

export function AuthProvider(props) {
    const history = useHistory();
    const [authSession, setAuthSession] = useState(getStoredAuthSession());
    const refreshTimer = useRef(null);
    const isAuthenticated = !!authSession;

    function updateSession(session) {
        // Sets new session data in session state
        // Session data are expected to be valid
        if(!isSessionValid(session))
            throw new Error("Provided session state is not valid")
        setTokenForAPI(session.token);
        setAuthSession(session);
    }

    async function refreshSession() {
        const response = await api.authRefresh();
        updateSession(response.data);
    }

    function logout(error) {
        let logoutReason = (
            error 
            ? {error} 
            : {success: "User logged out successfully."}
        )
        setAuthSession(null);
        history.push("/login", {
            prevLocation: history.location,
            ...logoutReason
        });
    }

    function hasCapability(capability) {
        return isAuthenticated && authSession.capabilities.indexOf(capability) >= 0
    }

    // Effect for 401 Not authenticated to clear session data
    useEffect(() => {
        // Initialize Authorization header on mount
        setTokenForAPI(isAuthenticated && authSession.token);
        // Set 401 Not Authenticated interceptor when AuthProvider is mounted
        const interceptor = (
            api.axios.interceptors.response.use(
                _=>_, 
                error => {
                    // Logout on 401
                    if (error.response && error.response.status === 401)
                        logout("Session expired. Please authenticate before accessing this page.");
                    return Promise.reject(error)
                }
            )
        )
        
        // Unset the interceptor when AuthProvider is unmounted
        return () => {
            api.axios.interceptors.response.eject(interceptor)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        function setRefreshTimer() {
            if(refreshTimer.current)
                return;
            refreshTimer.current = setInterval(refreshSession, 60000);
            refreshSession();
        }

        function clearRefreshTimer() {
            if(!refreshTimer.current)
                return;
            clearInterval(refreshTimer.current)
            refreshTimer.current = null;
        }

        // Set timer if user is logged in, clear otherwise
        (isAuthenticated ? setRefreshTimer : clearRefreshTimer)();
        return clearRefreshTimer;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated])

    // Synchronize current session data with local storage
    useEffect(() => {
        if(isAuthenticated)
            localStorage.setItem(localStorageAuthKey, JSON.stringify(authSession));
        else
            localStorage.removeItem(localStorageAuthKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return (
        <AuthContext.Provider value={{
            user: authSession,
            isAuthenticated: !!authSession,
            isAdmin: hasCapability("manage_users"),
            hasCapability,
            refreshSession,
            updateSession,
            logout
        }}>
            {props.children}
        </AuthContext.Provider>
    )
}