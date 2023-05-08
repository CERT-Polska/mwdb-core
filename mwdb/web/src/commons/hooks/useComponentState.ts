import { useState } from "react";

export function useComponentState() {
    // Functions (and components) are just called by useState and setter,
    // so we need to wrap the component with yet another function
    const [Component, setComponent] = useState<JSX.Element | undefined>();
    return {
        Component,
        setComponent: (newComponent: JSX.Element) => {
            setComponent(() => newComponent);
        },
    };
}
