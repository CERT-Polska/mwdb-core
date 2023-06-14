import { useContext } from "react";
import { AuthContext } from "../auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

type Props = {
    children?: JSX.Element;
};

export function RequiresAuth({ children }: Props) {
    /**
     * Wrapper for views that require authentication
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.isAuthenticated) {
        toast("You need to authenticate before accessing this page", {
            type: "error",
        });
        return (
            <Navigate
                to="/login"
                state={{
                    prevLocation: location,
                }}
            />
        );
    }
    return children ? children : <Outlet />;
}
