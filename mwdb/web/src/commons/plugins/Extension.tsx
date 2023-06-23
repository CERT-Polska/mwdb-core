import { fromPlugins } from "./loader";

type Props = {
    [extensionProp: string]: any;
    ident: string;
    fallback?: JSX.Element;
};

export function Extension({ ident, fallback, ...props }: Props) {
    const components = fromPlugins(ident);
    if (components.length === 0) return fallback || <></>;
    return (
        <>
            {components.map((ExtElement) => (
                <ExtElement {...props} />
            ))}
        </>
    );
}
