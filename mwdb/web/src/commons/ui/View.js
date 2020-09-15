import React from "react";
import ErrorBoundary, {Alert} from "./ErrorBoundary";
import { Extendable } from "../extensions";

export default function View(props) {
    let ident = props.ident;
    return (
        <ErrorBoundary>
            <div className={props.fluid ? "container-fluid" : "container"} style={props.style}>
                <Alert {...props}/>
                {  
                    ident ?
                    <Extendable ident={ident}>
                        {props.children}
                    </Extendable>
                    : props.children
                }
            </div>
        </ErrorBoundary>
    )
}
