import { useEffect, useRef } from "react";
import { Extension } from "./Extension";

type Props = {
    ident: string;
    children?: any;
    [extensionProp: string]: any;
};

function onMouseOver(this: HTMLDivElement, ev: MouseEvent) {
    console.log(this);
    if (this.className === "extendable-debug-box") {
        this.className = "extendable-debug-box active";
        ev.stopPropagation();
    }
}

function onMouseOut(this: HTMLDivElement) {
    if (this.className === "extendable-debug-box active")
        this.className = "extendable-debug-box";
}

function _Extendable({ ident, children, ...props }: Props) {
    return (
        <>
            {<Extension {...props} ident={`${ident}Before`} />}
            {
                <Extension {...props} ident={`${ident}Replace`}>
                    {children}
                </Extension>
            }
            {<Extension {...props} ident={`${ident}After`} />}
        </>
    );
}

function ExtendableDebugBox({ ident, children, ...props }: Props) {
    const debugBoxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const element = debugBoxRef.current;
        if (element) {
            element.addEventListener("mouseover", onMouseOver);
            element.addEventListener("mouseout", onMouseOut);
        }
        return () => {
            if (element) {
                element.addEventListener("mouseover", onMouseOver);
                element.addEventListener("mouseout", onMouseOut);
            }
        };
    }, []);

    return (
        <div
            className="extendable-debug-box"
            data-label={`Extendable ${ident}`}
            ref={debugBoxRef}
        >
            <_Extendable ident={ident} {...props}>
                {children}
            </_Extendable>
        </div>
    );
}

export const Extendable = import.meta.env.VITE_EXTENDABLE_DEBUG_BOX
    ? ExtendableDebugBox
    : _Extendable;
