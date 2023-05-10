import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useNavRedirect() {
    const navigate = useNavigate();
    const location = useLocation();

    function redirectTo(url: string) {
        navigate(url);
    }

    const goBackToPrevLocation = useCallback(() => {
        const locationState = location.state || {};
        const prevLocation = locationState.prevLocation || "/";
        navigate(prevLocation);
    }, [location]);

    return {
        goBackToPrevLocation,
        redirectTo,
    };
}
