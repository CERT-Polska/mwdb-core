import { useEffect, useState } from "react";

export function useJsonParseError(value) {
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        try {
            JSON.parse(value);
            setErrorMessage("");
        } catch (e) {
            setErrorMessage(e.toString());
        }
    }, [value]);

    return {
        errorMessage,
    };
}
