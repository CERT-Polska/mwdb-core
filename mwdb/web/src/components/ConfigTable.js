import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'


import { makeSearchLink, makeSearchDateLink } from "@mwdb-web/commons/helpers";
import { Extendable } from "@mwdb-web/commons/extensions";
import { ActionCopyToClipboard, DataTable, DateString, ObjectLink } from "@mwdb-web/commons/ui";


export function ConfigRow(props) {
    const key = props.configKey;
    const value = props.value;
    const path = props.path;
    const [expanded, setExpanded] = useState(false);

    const isObject = value && typeof value === 'object';
    const isEmbeddedBlob = isObject && Object.keys(value).length == 1 && Object.keys(value)[0] === "in-blob";
    const isRegularObject = isObject && !isEmbeddedBlob;

    useEffect(() => {
        // Automatically expand all nested objects if parent has been expanded
        if(props.parentExpanded && isRegularObject && !expanded)
            setExpanded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.parentExpanded])

    let rawValue, prettyValue;

    if(isRegularObject) {
        rawValue = prettyValue = JSON.stringify(value, null, 4);
    } else if(isEmbeddedBlob) {
        rawValue = value["in-blob"];
        prettyValue = <ObjectLink type="blob" id={value["in-blob"]} className="blob" />
    } else {
        rawValue = String(value)
        prettyValue = (
            <Link to={makeSearchLink(`cfg.${path.join('.')}`, value, false, "configs")}>
                {String(value)}
            </Link>
        )
    }

    const overflow = {
        maxWidth: '700px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
    }

    return (
        <React.Fragment>
            <tr className="flickerable">
                <th style={{cursor: 'pointer'}} onClick={(() => setExpanded(!expanded))}>
                    <FontAwesomeIcon icon={expanded ? faMinus : faPlus} size="sm"/>{" "}
                    {key}
                </th>
                {
                    expanded && !isRegularObject
                    ? (
                        <td>
                            <pre style={{whiteSpace: 'pre-wrap'}}>{rawValue}</pre>
                        </td>
                    ) : (
                        <td style={overflow} className="text-monospace">
                            {prettyValue}
                            <span className="ml-2">
                                <ActionCopyToClipboard text={rawValue} tooltipMessage="Copy value to clipboard"/>
                            </span>
                        </td>
                    )
                }
            </tr>
            {
                expanded && isRegularObject
                ? (
                    <tr className="nested">
                        <td className="nested" colspan="2" style={{ padding: 0 }}>
                            <ConfigRows
                                config={value}
                                parentExpanded={true}
                                indent={indent + 1}
                                path={path}
                            />
                        </td>
                    </tr>
                ) : []
            }
        </React.Fragment>
    )
}

export function ConfigRows(props) {
    const indent = props.indent || 0;
    const parentPath = props.path || [];
    const config = props.config
    
    let configKeys = Object.keys(config);
    if(!Array.isArray(config))
        configKeys = configKeys.sort()
    
    // Return ordered list of ConfigRow with calculated path
    return configKeys.map(
        (configKey) => {
            const path = (
                Array.isArray(config)
                // If Array: add the asterisk to the last element
                ? [
                    ...parentPath.slice(0, -1),
                    parentPath[parentPath.length - 1] + "*"
                ]
                // Else: just add next key to the path
                : parentPath.concat([configKey])
            )
            return <ConfigRow configKey={configKey} key={configKey} 
                              value={config[configKey]} 
                              parentExpanded={props.parentExpanded}
                              path={path}
                              indent={indent} />
        }
    )
}

export default function ConfigTable(props) {
    const object = props.object;

    return (
        <DataTable indent={indentLevel}>
            <Extendable ident="showConfigDetails">
                <tr key="config-family">
                    <th>Family</th>
                    <td id="config_family"><a href={makeSearchLink("family", object.family, false, "configs")}>{object.family}</a></td>
                </tr>
                <tr key="config-type">
                    <th>Config type</th>
                    <td id="config_family"><a href={makeSearchLink("type", object.config_type, false, "configs")}>{object.config_type}</a></td>
                </tr>
                <ConfigRows config={object.cfg}/>
                <tr key="config-upload-time">
                    <th>Upload time</th>
                    <td id="upload_time"> 
                    {
                        object.upload_time
                        ? (
                            <a href={makeSearchDateLink("upload_time", object.upload_time, "configs")}>
                                <DateString date={object.upload_time}/>
                            </a>
                        ) : []
                    }</td>
                </tr>
            </Extendable>
        </DataTable>
    )
}
