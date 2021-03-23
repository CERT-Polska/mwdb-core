import { useRouteMatch } from "react-router-dom";

export function useRemote() {
    // Returns current remote name or undefined if current view is local
    const match = useRouteMatch("/remote/:remote");
    return match && match.params.remote;
}

export function useRemotePath() {
    const remote = useRemote();
    return remote ? `/remote/${remote}` : "";
}
