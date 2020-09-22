import { createStore, applyMiddleware, combineReducers } from "redux";
import reduxThunk from "redux-thunk";
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { composeWithDevTools } from 'redux-devtools-extension';

import api from "@mwdb-web/commons/api";
import {authActions, authService, authReducer} from "@mwdb-web/commons/auth";
import {configReducer} from "@mwdb-web/commons/config";
import history from "@mwdb-web/commons/history";
import { fromPlugin } from "@mwdb-web/commons/extensions";

let reducers = combineReducers({
    auth: authReducer,
    config: configReducer,
    router: connectRouter(history)
});

for(let extraReducers of fromPlugin("reducers"))
    reducers = {...reducers, ...extraReducers}

let middlewares = [
    reduxThunk,
    routerMiddleware(history),
    ...fromPlugin("middlewares")
];

let store = createStore(
    reducers,
    {},
    composeWithDevTools(
        applyMiddleware(
            ...middlewares
        )
    ),
);

if(store.getState().auth.loggedUser)
{
    let token = store.getState().auth.loggedUser.token;
    api.axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}

authService.refreshService.refreshToken();

api.axios.interceptors.response.use(_=>_, error =>
{
    if (error.response && error.response.status === 401)
    {
        store.dispatch(authActions.logout({error: "Session expired. Please authenticate before accessing this page"}, history.location))
    }
    return Promise.reject(error)
});

export default store;