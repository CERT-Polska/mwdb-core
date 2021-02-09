import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Extendable } from "@mwdb-web/commons/extensions";
import { ObjectContext } from "@mwdb-web/commons/context";
import ObjectAttributes from "../../Attributes";

export default function AttributesBox() {
    const context = useContext(ObjectContext);
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);

    return (
        <Extendable ident="attributesBox" object={context.object}>
            <div className="card card-default">
                <div className="card-header">
                    Attributes
                    <Link
                        to="#"
                        className="float-right"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setAttributeAddModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon="plus" pull="left" size="1x" />
                        Add
                    </Link>
                </div>
                <ObjectAttributes
                    object={context.object}
                    isModalOpen={isAttributeAddModalOpen}
                    onRequestModalClose={() => setAttributeAddModalOpen(false)}
                />
            </div>
        </Extendable>
    );
}
