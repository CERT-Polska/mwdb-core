import { useCallback } from "react";
import {
    useNavigate,
    useLocation,
    NavigateOptions,
    To,
} from "react-router-dom";
import { toast } from "react-toastify";
import { AxiosServerErrors } from "@mwdb-web/types/types";
import { getErrorMessage } from "@mwdb-web/commons/helpers";

type Messages = {
    success?: string;
    error?: AxiosServerErrors | any;
    warning?: string;
};

export type SetAlertProps = NavigateOptions & Messages;

export type RedirectToAlertProps = SetAlertProps & {
    target: To;
};

export function useViewAlert() {
    const navigate = useNavigate();
    const location = useLocation();

    const setMessages = useCallback(({ success, error, warning }: Messages) => {
        if (success) {
            toast(success, { type: "success" });
        }

        if (error) {
            toast(getErrorMessage(error), { type: "error" });
        }

        if (warning) {
            toast(warning, { type: "warning" });
        }
    }, []);

    const setAlert = useCallback(
        ({ success, error, warning, state }: SetAlertProps) => {
            const { pathname, search } = location;
            setMessages({ success, error, warning });

            navigate(
                { pathname, search },
                {
                    state: {
                        ...location.state,
                        ...(state || {}),
                    },
                    replace: true,
                }
            );
        },
        [location, navigate]
    );

    const redirectToAlert = useCallback(
        ({ success, error, warning, target, state }: RedirectToAlertProps) => {
            setMessages({ success, error, warning });

            navigate(target, {
                state: {
                    ...(state || {}),
                },
            });
        },
        [navigate]
    );

    return { setAlert, redirectToAlert };
}
