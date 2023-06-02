import { useContext } from "react";

import { ConfigTable } from "../../Config/common/ConfigTable";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ObjectTab } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";

type Props = {
    label: string;
};

export function LatestConfigTab(props: Props) {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();

    if (!context.object) {
        return <></>;
    }

    // Don't show tab if object doesn't have latest config
    if (!context.object.latest_config) return <></>;
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
            actions={[
                <ObjectAction
                    label="Go to config"
                    link={`${remotePath}/config/${context.object.latest_config.id}`}
                />,
            ]}
            component={() => (
                <ConfigTable object={context.object!.latest_config} />
            )}
        />
    );
}
