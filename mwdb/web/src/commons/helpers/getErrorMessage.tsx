import { intersperse } from ".";
import { AxiosServerErrors, GenericOrJSX } from "@mwdb-web/types/types";

export function getErrorMessage(
    error: AxiosServerErrors | any
): GenericOrJSX<string>[] | string {
    if (error.response && error.response.data) {
        if (error.response.data.message) {
            return error.response.data.message;
        }
        if (error.response.data.errors) {
            let messages = Object.keys(error.response.data.errors).map(
                (key) => {
                    if (key === "_schema")
                        return error.response!.data.errors![key];
                    else return `${key}: ${error.response!.data.errors![key]}`;
                }
            );
            return intersperse(messages, <br />);
        }
    }
    return error.toString();
}
