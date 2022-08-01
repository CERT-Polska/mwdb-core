import identicon from "identicon.js";
import React from "react";

import sha1 from "sha1";

export default function Identicon({ data, hash, margin, size, style }) {
    if (typeof data === "undefined" && typeof hash === "undefined") return;
    const identiconData = hash || sha1(data);
    const options = {
        margin: parseInt(margin, 10) || 0.08,
        size: parseInt(size, 10),
        format: "svg",
    };
    const ident = new identicon(identiconData, options).toString();

    const identiconSrc = "data:image/svg+xml;base64," + ident;

    return (
        <img
            className="identicon"
            src={identiconSrc}
            alt="identicon"
            style={style}
        />
    );
}
