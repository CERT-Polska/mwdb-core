import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useComponentState } from "@mwdb-web/commons/hooks";

describe("useComponentState", () => {
    test("should initialize with React.Fragment as the default component", () => {
        const { result } = renderHook(() => useComponentState());
        expect(result.current.Component).toBe(React.Fragment);
    });

    test("should update the component when setComponent is called", () => {
        const { result } = renderHook(() => useComponentState());
        const newComponent = () => <div>New Component</div>;
        act(() => {
            result.current.setComponent(newComponent);
        });
        expect(result.current.Component).toBe(newComponent);
    });
});
