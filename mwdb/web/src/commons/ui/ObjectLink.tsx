import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../auth";
import { mapObjectType } from "../helpers";

import { Hash } from "./Hash";

type Props = {
    type: string;
    id: string;
    className?: string;
    inline?: boolean;
};

export function ObjectLink(props: Props) {
    const { type, id, className, inline } = props;
    const auth = useContext(AuthContext);
    const objectType = mapObjectType(props.type);

    if (!auth.isAdmin && (objectType === "user" || objectType === "group")) {
        return <span>{id}</span>;
    }

    return (
        <Link to={`/${objectType}/${id}`} className={className}>
            {type === "user" || type === "group" ? (
                id
            ) : (
                <Hash hash={id} inline={inline} />
            )}
        </Link>
    );
}
