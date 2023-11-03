import { toast } from "react-toastify";
import { api } from "../api";
import { getErrorMessage } from "./getErrorMessage";

export async function authenticate(provider: string, action: string) {
    try {
        const response = await api.oauthAuthenticate(provider);
        const expirationTime = Date.now() + 5 * 60 * 1000;
        sessionStorage.setItem(
            `openid_${response.data["state"]}`,
            JSON.stringify({
                provider: provider,
                nonce: response.data["nonce"],
                action: action,
                expiration: expirationTime,
            })
        );
        window.location = response.data["authorization_url"];
    } catch (e) {
        toast(getErrorMessage(e), {
            type: "error",
        });
    }
}
