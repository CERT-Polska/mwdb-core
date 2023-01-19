import React from "react";
import _ from "lodash";

import * as plugins from "./plugins";

export function fromPlugin(element) {
    return _.flatten(
        Object.keys(plugins).map((name) => plugins[name][element] || [])
    );
}

export function Extension(props) {
    return (
        <React.Fragment>
            {fromPlugin(props.ident).map((ExtElement) => (
                <ExtElement {...props} />
            ))}
        </React.Fragment>
    );
}

export function Extendable(props) {
    let ident = props.ident;
    let Replacer = fromPlugin(`${ident}Replace`)[0];
    let replacer;
    if (Replacer) replacer = <Replacer {...props} />;
    return (
        <React.Fragment>
            {<Extension {...props} ident={`${ident}Before`} />}
            {replacer || props.children}
            {<Extension {...props} ident={`${ident}After`} />}
        </React.Fragment>
    );
}
