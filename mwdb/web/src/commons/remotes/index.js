import { useLocation, matchPath } from "react-router-dom";

export function useRemote() {
    // Returns current remote name or undefined if current view is local
    const location = useLocation();
    const remotePath = matchPath(
        { path: "/remote/:remote", end: false },
        location.pathname
    );
    return remotePath && remotePath.params.remote;
}

export function useRemotePath() {
    const remote = useRemote();
    return remote ? `/remote/${remote}` : "";
}
