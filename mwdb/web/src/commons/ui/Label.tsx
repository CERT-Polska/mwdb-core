type Props = {
    label: string;
    required?: boolean;
    htmlFor?: string;
};

export function Label(props: Props) {
    const { label, required, htmlFor } = props;

    return (
        <label className={required ? "required" : ""} htmlFor={htmlFor}>
            {label}
        </label>
    );
}
