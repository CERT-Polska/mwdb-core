import { useContext } from "react";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { Capability } from "@mwdb-web/types/types";

export function FavoriteAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    async function markFavoriteObject() {
        try {
            await api.addObjectFavorite(context.object!.id!);
            context.updateObject();
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function unmarkFavoriteObject() {
        try {
            await api.removeObjectFavorite(context.object!.id!);
            context.updateObject();
        } catch (error) {
            context.setObjectError(error);
        }
    }

    if (!auth.hasCapability(Capability.personalize) || api.remote) return <></>;

    if (!context.object) {
        return <></>;
    }

    if (context.object.favorite)
        return (
            <ObjectAction
                label="Unfavorite"
                icon={faStar}
                action={() => unmarkFavoriteObject()}
            />
        );
    else
        return (
            <ObjectAction
                label="Favorite"
                icon={farStar}
                action={() => markFavoriteObject()}
            />
        );
}
