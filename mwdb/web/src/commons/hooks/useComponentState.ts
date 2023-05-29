import React, { useState } from "react";

export function useComponentState() {
    // Functions (and components) are just called by useState and setter,
    // so we need to wrap the component with yet another function
    const [Component, setComponent] = useState<React.ComponentType>(
        React.Fragment
    );
    return {
        Component,
        setComponent: (newComponent: React.ComponentType) => {
            setComponent(() => newComponent);
        },
    };
}
