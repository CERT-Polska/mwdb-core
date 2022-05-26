import { useMatch } from "react-router-dom-v5-compat";

export function useRemote() {
    // Returns current remote name or undefined if current view is local
    const match = useMatch("/remote/:remote");
    return match && match.params.remote;
}

export function useRemotePath() {
    const remote = useRemote();
    return remote ? `/remote/${remote}` : "";
}
