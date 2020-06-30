import authActionTypes from "./types"
import authService from "./service";

export default function(state, action) {
    if(state === undefined)
        return { loggedUser: authService.getAuthenticatedUser() }
    switch(action.type) {
        case authActionTypes.LOGIN_SUCCESS:
            return { ...state, loggedUser: action.user, prevLocation: null }
        case authActionTypes.LOGIN_FAILURE:
        case authActionTypes.LOGOUT:
            return { ...state, loggedUser: undefined, prevLocation: action.prevLocation || state.prevLocation }
        default:
            return state;
    }
}