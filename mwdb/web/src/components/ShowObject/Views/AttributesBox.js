import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Extendable } from "@mwdb-web/commons/extensions";
import { APIContext } from "@mwdb-web/commons/api/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import ConnectedObjectAttributes from "../../Attributes";

export default function AttributesBox() {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);

    return (
        <Extendable ident="attributesBox" object={context.object}>
            <div className="card card-default">
                <div className="card-header">
                    Attributes
                    {!api.remote ? (
                        <Link
                            to="#"
                            className="float-right"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setAttributeAddModalOpen(true);
                            }}
                        >
                            <FontAwesomeIcon
                                icon="plus"
                                pull="left"
                                size="1x"
                            />
                            Add
                        </Link>
                    ) : (
                        []
                    )}
                </div>
                <ConnectedObjectAttributes
                    object={context.object}
                    isModalOpen={isAttributeAddModalOpen}
                    onRequestModalClose={() => setAttributeAddModalOpen(false)}
                />
            </div>
        </Extendable>
    );
}
