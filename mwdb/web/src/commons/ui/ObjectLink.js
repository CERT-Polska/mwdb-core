import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";

import { AuthContext } from "../auth";
import { mapObjectType } from "../helpers";

import Hash from "./Hash";

export default function ObjectLink(props) {
    const auth = useContext(AuthContext);
    const objectType = mapObjectType(props.type);
    const { remote } = useParams();
    const remotePath = remote ? `/remote/${remote}` : "";

    let linkElement = (
        <Link
            to={`${remotePath}/${objectType}/${props.id}`}
            className={props.className}
        >
            {props.type === "user" || props.type === "group" ? (
                props.id
            ) : (
                <Hash hash={props.id} inline={props.inline} />
            )}
        </Link>
    );

    if (!auth.isAdmin && (objectType === "user" || objectType === "group")) {
        linkElement = <span>{props.id}</span>;
    }

    return linkElement;
}
