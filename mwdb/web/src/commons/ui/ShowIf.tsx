type Props = {
    condition?: boolean;
    children: JSX.Element;
};

export function ShowIf({ condition = false, children }: Props) {
    return condition ? children : <></>;
}
