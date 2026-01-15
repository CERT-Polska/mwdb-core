import React, { Children, useMemo } from "react";

type InjectAfterProps = {
    afterElementIndex: number;
    element: React.ComponentType;
    children: any[];
};

export function InjectAfter({
    afterElementIndex,
    element,
    children,
}: InjectAfterProps) {
    return useMemo(() => {
        const Element = element;
        const result: any = [];
        Children.map(children, (child, index) => {
            result.push(child);
            if (index === afterElementIndex) {
                result.push(<Element />);
            }
        });
        return result;
    }, [afterElementIndex, element, children]);
}
