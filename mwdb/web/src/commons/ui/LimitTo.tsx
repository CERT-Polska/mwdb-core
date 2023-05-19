type Props = {
    children: JSX.Element[];
    count: number;
};

export function LimitTo({ children, count }: Props) {
    const more =
        children.length > count
            ? [
                  <small className="text-muted" key={"more-children"}>
                      {" "}
                      and {children.length - 5} more
                  </small>,
              ]
            : [];
    return <> {[...children.slice(0, count), ...more]}</>;
}
