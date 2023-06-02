import { Extendable } from "../plugins";

type Props = {
    ident: string;
    children: React.ReactNode;
    fluid?: boolean;
    style?: React.CSSProperties;
    showIf?: boolean;
};

export function View({ ident, children, fluid, style, showIf = true }: Props) {
    /**
     * View component for all main views. Views shouldn't be nested.
     * Properties spec:
     *
     * ident - identifier that makes View Extendable by plugins
     * showIf - allows to show view conditionally (e.g. if all required data are loaded)
     * fluid - uses wide fluid view instead of default container
     * style - custom container styling
     */
    const viewLayout = ident ? (
        <Extendable ident={ident}>{children}</Extendable>
    ) : (
        children
    );
    // If condition is undefined => assume default true
    return (
        <div className={fluid ? "container-fluid" : "container"} style={style}>
            {showIf ? viewLayout : []}
        </div>
    );
}
