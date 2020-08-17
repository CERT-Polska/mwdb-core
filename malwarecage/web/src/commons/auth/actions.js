import authActionTypes from "./types";
import authService from "./service";

import { push } from "connected-react-router";

function login(username, password, prevLocation) {
    return dispatch => {
        dispatch({ type: authActionTypes.LOGIN_REQUEST, username })
        authService.login(username, password)
            .then(user => {
                dispatch({ type: authActionTypes.LOGIN_SUCCESS, user: user, prevLocation: null });
                dispatch(push(prevLocation || "/"));
            })
            .catch(err => {
                // Error is unclonable and we can't directly put it in location state
                // We need to extract response data part
                let error = { response: { data: err.response.data } };
                dispatch({ type: authActionTypes.LOGIN_FAILURE});
                dispatch(push({ pathname: "/login", state: {error} }));
            })
    }
}

function logout(state, prevLocation) {
    return dispatch => {
        authService.logout();
        if(prevLocation && prevLocation.pathname === "/login")
            prevLocation = null;
        dispatch({ type: authActionTypes.LOGOUT, prevLocation });
        dispatch(push({ pathname: "/login", state }))
    }
}

export default { login, logout };