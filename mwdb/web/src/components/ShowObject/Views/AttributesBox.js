import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Extendable } from "@mwdb-web/commons/extensions";
import ObjectAttributes from "../../Attributes";

export default function AttributesBox() {
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);

    return (
        <Extendable ident="attributesBox">
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
                    isModalOpen={isAttributeAddModalOpen}
                    onRequestModalClose={() => setAttributeAddModalOpen(false)}
                />
            </div>
        </Extendable>
    );
}
