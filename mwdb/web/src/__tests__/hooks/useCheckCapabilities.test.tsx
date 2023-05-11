import { renderHook } from "@testing-library/react";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";
import { AuthContextValues } from "@mwdb-web/types/types";
import { AuthContext } from "@mwdb-web/commons/auth";
import { AuthProviderProps } from "@mwdb-web/types/props";

describe("useCheckCapabilities", () => {
    const authContextValue = {
        user: {
            capabilities: [
                "access_all_objects",
                "access_all_objects",
                "adding_tags",
            ],
        },
    } as AuthContextValues;

    const wrapperWithInitValues =
        (initValues: AuthContextValues) => (props: AuthProviderProps) =>
            (
                <AuthContext.Provider value={initValues}>
                    {props.children}
                </AuthContext.Provider>
            );

    it("should return true if user has the capability", () => {
        const wrapper = wrapperWithInitValues(authContextValue);
        const { result } = renderHook(() => useCheckCapabilities(), {
            wrapper,
        });
        const { userHasCapabilities } = result.current;

        expect(userHasCapabilities("access_all_objects")).toBe(true);
    });

    it("should return false if user doesn't have the capability", () => {
        const wrapper = wrapperWithInitValues(authContextValue);
        const { result } = renderHook(() => useCheckCapabilities(), {
            wrapper,
        });
        const { userHasCapabilities } = result.current;

        expect(userHasCapabilities("karton_unassign")).toBe(false);
    });
});
