import React, { useContext } from "react";

import ConfigTable from "../../ConfigTable";

import { ObjectContext } from "../../../commons/context";
import { ObjectAction, ObjectTab } from "../../../commons/ui";
import { useRemotePath } from "../../../commons/remotes";

export default function LatestConfigTab(props) {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();

    // Don't show tab if object doesn't have latest config
    if (!context.object.latest_config) return [];
    return (
        <ObjectTab
            tab="config"
            label={
                <div>
                    {props.label}{" "}
                    {context.object.latest_config.family ? (
                        <span className="badge badge-danger">
                            {context.object.latest_config.family}
                        </span>
                    ) : (
                        []
                    )}
                </div>
            }
            actions={
                <ObjectAction
                    label="Go to config"
                    link={`${remotePath}/config/${context.object.latest_config.id}`}
                />
            }
            component={() => (
                <ConfigTable object={context.object.latest_config} />
            )}
        />
    );
}
