import { Extension } from "./Extension";

type Props = {
    [extensionProp: string]: any;
    ident: string;
    fallback?: JSX.Element;
};

export function Extendable({ ident, children, ...props }: Props) {
    return (
        <>
            {<Extension {...props} ident={`${ident}Before`} />}
            {
                <Extension
                    {...props}
                    ident={`${ident}Replace`}
                    fallback={children}
                />
            }
            {<Extension {...props} ident={`${ident}After`} />}
        </>
    );
}
