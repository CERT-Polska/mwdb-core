import api from "../api";

function setAuthToken(userData) {
    let previousInfo = getAuthenticatedUser() || {}
    let userInfo = {
        ...previousInfo,
        ...userData
    }
    localStorage.setItem('user', JSON.stringify(userInfo))
    api.axios.defaults.headers.common['Authorization'] = 'Bearer ' + userData.token;
    return userInfo;
}

async function login(username, password) {
    let user = await api.authLogin(username, password)
    refreshService.setTimer();
    return setAuthToken(user.data);
}

function logout() {
    localStorage.removeItem('user');
    refreshService.clearTimer();
}

function getAuthenticatedUser() {
    let user = JSON.parse(localStorage.getItem("user"));
    // Check local storage validity
    if(user && (!user["token"] || !user["login"]))
    {
        logout();
        return null;
    }
    return user;
}

function isTokenValid() {
    let user = getAuthenticatedUser();
    if(!user)
        return false;
    return JSON.parse(atob(user.token.split(".")[0])).exp > new Date() / 1000;
}

class RefreshService {
    constructor() {
        this.timer = null;
    }

    setTimer() {
        if(!isTokenValid())
            return;
        if(this.timer)
            this.clearTimer();
        this.timer = setTimeout(() => this.refreshToken(), 15 * 60 * 1000);
    }

    async refreshToken() {
        if(!isTokenValid())
            return;
        let user = await api.authRefresh();
        this.setTimer();
        return setAuthToken(user.data);
    }

    clearTimer() {
        clearInterval(this.timer);
        this.timer = null;
    }
}

var refreshService = new RefreshService();

const userService = {
    login, logout, getAuthenticatedUser, refreshService
}

export default userService;