import { fromPlugins } from "./loader";

type Props = {
    ident: string;
    children?: any;
    [extensionProp: string]: any;
};

export function Extension({ ident, children, ...props }: Props) {
    const components = fromPlugins(ident);
    if (components.length === 0) return children || <></>;
    return (
        <>
            {components.map((ExtElement) => (
                <ExtElement {...props}>{children}</ExtElement>
            ))}
        </>
    );
}
