import { authenticate } from "@mwdb-web/commons/helpers/authenticate";

type Props = {
    provider: string;
    color: string;
};

export function ProviderButton({ provider, color }: Props) {
    const chosenProvider = provider;

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                authenticate(chosenProvider, "authorize");
            }}
            className="form-control btn btn-primary mb-1"
            style={{
                backgroundColor: color,
                borderStyle: "none",
            }}
        >
            Log in with {chosenProvider}
        </button>
    );
}
