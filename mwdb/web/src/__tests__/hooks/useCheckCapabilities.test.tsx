import { renderHook } from "@testing-library/react";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";
import { Capability } from "@mwdb-web/types/types";
import { AuthContext } from "@mwdb-web/commons/auth";
import { AuthProviderProps } from "@mwdb-web/types/props";
import { AuthContextValues } from "@mwdb-web/types/context";

describe("useCheckCapabilities", () => {
    const authContextValue = {
        user: {
            capabilities: [
                Capability.accessAllObjects,
                Capability.accessAllObjects,
                Capability.addingTags,
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

        expect(userHasCapabilities(Capability.accessAllObjects)).toBe(true);
    });

    it("should return false if user doesn't have the capability", () => {
        const wrapper = wrapperWithInitValues(authContextValue);
        const { result } = renderHook(() => useCheckCapabilities(), {
            wrapper,
        });
        const { userHasCapabilities } = result.current;

        expect(userHasCapabilities(Capability.removingKarton)).toBe(false);
    });
});
