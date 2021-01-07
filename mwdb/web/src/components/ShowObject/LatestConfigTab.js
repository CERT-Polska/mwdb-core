import React, { useContext } from "react";

import ConfigTable from "../ConfigTable";

import { ObjectAction, ObjectTab } from "./ObjectTab";
import { ObjectContext } from "@mwdb-web/commons/context";


export default function LatestConfigTab(props) {
    const context = useContext(ObjectContext);

    // Don't show tab if object doesn't have latest config
    if(!context.object.latest_config)
        return [];

    return (
        <ObjectTab
            tab="config"
            label={
                <div>{props.label} {
                    context.object.latest_config.family 
                     ? <span class="badge badge-danger">{context.object.latest_config.family}</span>
                     : []
                }
                </div>
            }
            actions={
                <ObjectAction 
                    label="Go to config"
                    link={"/config/"+context.object.latest_config.id}
                />
            }
            component={
                () => <ConfigTable object={context.object.latest_config} />
            }
        />
    )   
}