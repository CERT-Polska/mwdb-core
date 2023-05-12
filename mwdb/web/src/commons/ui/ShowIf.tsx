type Props = {
    condition: boolean;
    children: JSX.Element;
};

export function ShowIf({ condition, children }: Props) {
    return condition ? children : <></>;
}
