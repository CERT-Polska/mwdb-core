import identicon from "identicon.js";
import React, { useState, useEffect, useRef } from "react";

import sha1 from "sha1";

export default function Identicon(props) {
    const [identiconState, setIdenticonState] = useState("");
    const mounted = useRef();

    const updateState = () => {
        if (
            typeof props.data === "undefined" &&
            typeof props.hash === "undefined"
        )
            return;
        let data = props.hash || sha1(props.data);
        let options = {
            margin: parseInt(props.margin, 10) || 0.08,
            size: parseInt(props.size, 10),
            format: "svg",
        };
        let ident = new identicon(data, options).toString();

        setIdenticonState("data:image/svg+xml;base64," + ident);
    };

    useEffect(() => {
        if (!mounted.current) {
            updateState();
        } else {
            updateState();
        }
    });

    return (
        <img
            className="identicon"
            src={identiconState}
            alt="identicon"
            style={props.style}
        />
    );
}
