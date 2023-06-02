import { escapeSearchField } from "@mwdb-web/commons/helpers";
import { DataTable } from "@mwdb-web/commons/ui";
import { ConfigRow } from "./ConfigRow";

type Props = {
    config: any;
    path?: string[];
    indent?: number;
    parentExpanded?: boolean;
};

export function ConfigRows(props: Props) {
    const indent = props.indent || 0;
    const parentPath = props.path || [];
    const config = props.config;

    let configKeys = Object.keys(config);
    if (!Array.isArray(config)) configKeys = configKeys.sort();

    // Return ordered list of ConfigRow with calculated path
    const rows = configKeys.map((configKey) => {
        const path = Array.isArray(config)
            ? // If Array: add the asterisk to the last element
              [
                  ...parentPath.slice(0, -1),
                  parentPath[parentPath.length - 1] + "*",
              ]
            : // Else: just add next key to the path
              parentPath.concat([escapeSearchField(configKey)]);
        return (
            <ConfigRow
                configKey={configKey}
                key={configKey}
                value={config[configKey]}
                parentExpanded={props.parentExpanded}
                path={path}
                indent={indent}
            />
        );
    });

    if (indent > 0) return <DataTable indent={indent}>{rows}</DataTable>;
    return <>{rows}</>;
}
