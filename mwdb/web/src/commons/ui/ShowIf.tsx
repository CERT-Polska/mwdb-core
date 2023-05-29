type Props = {
    condition: boolean;
    children: React.ReactNode;
};

export function ShowIf({ condition, children }: Props) {
    return condition ? children : [];
}
