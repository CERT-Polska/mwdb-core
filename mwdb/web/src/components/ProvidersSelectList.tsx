import { useState } from "react";
import { authenticate } from "@mwdb-web/commons/helpers/authenticate";

type Props = {
    providersList: string[];
};

export function ProvidersSelectList({ providersList }: Props) {
    const availableProviders = providersList;
    const [chosenProvider, setChosenProvider] = useState<string>("");

    return (
        <form>
            <select
                className="custom-select"
                onChange={(e) => {
                    setChosenProvider(e.target.value);
                }}
            >
                <option value="" hidden>
                    Select provider...
                </option>
                {availableProviders.map((provider) => (
                    <option value={provider}>{provider}</option>
                ))}
            </select>
            <button
                className="form-control btn btn-primary mt-1"
                style={{ backgroundColor: "#3c5799" }}
                onClick={(e) => {
                    e.preventDefault();
                    authenticate(chosenProvider, "authorize");
                }}
            >
                Log in with selected provider
            </button>
        </form>
    );
}
