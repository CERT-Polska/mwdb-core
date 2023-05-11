import { useViewAlert } from "@mwdb-web/commons/hooks";
import {
    RedirectToAlertProps,
    SetAlertProps,
} from "@mwdb-web/commons/hooks/useViewAlert";
import { renderHook } from "@testing-library/react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as any),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
}));

jest.mock("react-toastify", () => ({
    toast: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockLocation = {
    pathname: "/",
    search: "",
    state: {},
};

describe("useViewAlert", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (useLocation as jest.Mock).mockReturnValue(mockLocation);
    });

    test("should set alert and navigate with state", () => {
        const { result } = renderHook(() => useViewAlert());

        const setAlertProps: SetAlertProps = {
            success: "Success message",
            state: { additionalState: true },
        };

        result.current.setAlert(setAlertProps);

        expect(toast).toHaveBeenCalledWith("Success message", {
            type: "success",
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            { pathname: "/", search: "" },
            { replace: true, state: { additionalState: true } }
        );
    });

    test("should set error alert and navigate without state", () => {
        const { result } = renderHook(() => useViewAlert());

        const setAlertProps = {
            error: {
                response: {
                    data: {
                        message: "Error message",
                    },
                },
            },
        } as SetAlertProps;

        result.current.setAlert(setAlertProps);

        expect(toast).toHaveBeenCalledWith("Error message", { type: "error" });

        expect(mockNavigate).toHaveBeenCalledWith(
            { pathname: "/", search: "" },
            { replace: true, state: {} }
        );
    });

    test("should set error as a string alert", () => {
        const { result } = renderHook(() => useViewAlert());

        const setAlertProps: SetAlertProps = {
            error: "String Error Message",
        };

        result.current.setAlert(setAlertProps);

        expect(toast).toHaveBeenCalledWith("String Error Message", {
            type: "error",
        });
    });

    test("should redirect with alert and state", () => {
        const { result } = renderHook(() => useViewAlert());

        const redirectToAlertProps: RedirectToAlertProps = {
            warning: "Warning message",
            target: "/target",
            state: { additionalState: true },
        };

        result.current.redirectToAlert(redirectToAlertProps);

        expect(toast).toHaveBeenCalledWith("Warning message", {
            type: "warning",
        });

        expect(mockNavigate).toHaveBeenCalledWith("/target", {
            state: { additionalState: true },
        });
    });
});
