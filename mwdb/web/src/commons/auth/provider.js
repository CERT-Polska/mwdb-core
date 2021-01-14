import React, {useState, useEffect} from "react";
import { useHistory } from 'react-router';

import api from "../api";

import { AuthContext } from "./context";

const localStorageAuthKey = "user"

function isSessionValid(authSession) {
    if(!authSession || !authSession.token)
        // Token is missing
        return false;
    if(JSON.parse(atob(authSession.split(".")[0])).exp <= new Date() / 1000)
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
    const [authSession, setAuthSession] = useState(getStoredAuthSession());
    const history = useHistory();

    function updateSession(session) {
        // Sets new session data in session state
        // Session data are expected to be valid
        if(!isSessionValid(session))
            throw new Error("Provided session state is not valid")
        setTokenForAPI(session.token);
        setAuthSession(session);
    }

    function logout(error) {
        let logoutReason = (
            error 
            ? {error} 
            : {success: "User logged out successfully."}
        )
        setAuthSession(null);
        history.push("/logout", {
            prevLocation: history.location,
            ...logoutReason
        });
    }

    function hasCapability(capability) {
        return authSession && authSession.capabilities.indexOf(capability) >= 0
    }

    // Effect for 401 Not authenticated to clear session data
    useEffect(() => {
        // Initialize Authorization header on mount
        setTokenForAPI(authSession && authSession.token);
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
    }, [])

    // Synchronize current session data with local storage
    useEffect(() => {
        if(authSession)
            localStorage.setItem(localStorageAuthKey, JSON.stringify(authSession));
        else
            localStorage.removeItem(localStorageAuthKey);
    }, [authSession]);

    return (
        <AuthContext.Provider value={{
            user: authSession,
            isAuthenticated: !!authSession,
            isAdmin: hasCapability("manage_users"),
            hasCapability,
            updateSession,
            logout
        }}>
            {props.children}
        </AuthContext.Provider>
    )
}