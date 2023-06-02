import IdenticonJS, { IdenticonOptions } from "identicon.js";
import { isNil } from "lodash";
import { CSSProperties } from "react";

import sha1 from "sha1";

type Props = {
    size: string;
    data?: string;
    hash?: string;
    style?: CSSProperties;
};

export function Identicon({ data, hash, size, style }: Props) {
    if (isNil(data) && isNil(hash)) {
        return <></>;
    }
    const identiconData = hash || sha1(data ?? "");
    const options: IdenticonOptions = {
        size: parseInt(size, 10),
        format: "svg",
    };

    const ident = new IdenticonJS(identiconData, options).toString();

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
