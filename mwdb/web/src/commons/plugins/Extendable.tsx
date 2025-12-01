import { Extension } from "./Extension";

type Props = {
    ident: string;
    children?: any;
    [extensionProp: string]: any;
};

export function Extendable({ ident, children, ...props }: Props) {
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
