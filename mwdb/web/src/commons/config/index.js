import api from "../api";

const CONFIG_INIT_STATE = Symbol("CONFIG_INIT_STATE");
const CONFIG_FAILED_STATE = Symbol("CONFIG_FAILED_STATE");

function init() {
    return dispatch => {
        api.getServerInfo().then(
            response => {
                dispatch({ type: CONFIG_INIT_STATE, config: response.data })
            }
        ).catch(error => dispatch({ type: CONFIG_FAILED_STATE, error: `Can't connect to server API: ${error}` }))
    }
}

export function configReducer(state, action) {
    if(state === undefined)
        return { config: null }
    switch(action.type) {
        case CONFIG_INIT_STATE:
            return { ...state, config: action.config }
        case CONFIG_FAILED_STATE:
            return { ...state, config: null, error: action.error }
        default:
            return state;
    }
}

export const configActions = { init };
