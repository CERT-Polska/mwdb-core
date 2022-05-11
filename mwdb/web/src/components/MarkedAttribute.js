import React, { useState } from "react";
import AceEditor from "react-ace";
import { renderValue } from "./MarkedMustache";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

import { DataTable, View } from "@mwdb-web/commons/ui";

const demoTemplate = `
**Link to sample**: https://www.virustotal.com/gui/file/{{object.sha256}}/detection

------------
**Sections**:
|Name|Virtual Address|Virtual Size|Raw Size|MD5|
|----|---------------|------------|--------|---|
{{#value.pe-sections}}
|{{name}}|\`{{vaddr}}\`|\`{{vsize}}\`|\`{{psize}}\`|{{md5}}|
{{/value.pe-sections}}

------------
**Imports**:
{{#value.imports}}
- **{{dllname}}**
  {{#functions}}
    - {{.}}
  {{/functions}}
{{/value.imports}}
`;

const demoValue = JSON.stringify(
    {
        object: {
            name: "malware.exe",
            sha1: "8e0f7213b6428434547a29b4ad9a60550ec8ba7a",
            sha256: "32fae9922417d6405bf60144d819d5e02b44060fa8f07e5e71c824725f44307f",
        },
        key: "test-attribute",
        value: {
            "simple-number": 0xdeadbeef,
            "pe-sections": [
                {
                    name: ".text",
                    vaddr: 4096,
                    vsize: 26564,
                    psize: 26624,
                    md5: "0d301800a1129c1b34c24e9c70a83a2a",
                },
                {
                    name: ".rdata",
                    vaddr: 32768,
                    vsize: 5018,
                    psize: 5120,
                    md5: "8c5edfd8ff9cc0135e197611be38ca18",
                },
                {
                    name: ".data",
                    vaddr: 40960,
                    vsize: 3795896,
                    psize: 1536,
                    md5: "c47ec1a5b78405f05a7f14418434b039",
                },
                {
                    name: ".ndata",
                    vaddr: 3837952,
                    vsize: 65536,
                    psize: 0,
                    md5: "<empty>",
                },
                {
                    name: ".rsrc",
                    vaddr: 3903488,
                    vsize: 2640,
                    psize: 3072,
                    md5: "d79dec7fbf7b676592533742181cc502",
                },
            ],
            imports: [
                {
                    dllname: "SHELL32.dll",
                    functions: [
                        "SHBrowseForFolderW",
                        "ShellExecuteExW",
                        "SHFileOperationW",
                        "SHGetFileInfoW",
                        "SHGetPathFromIDListW",
                        "SHGetSpecialFolderLocation",
                    ],
                },
                {
                    dllname: "KERNEL32.dll",
                    functions: [
                        "CloseHandle",
                        "CompareFileTime",
                        "CopyFileW",
                        "CreateDirectoryW",
                        "CreateFileW",
                        "CreateProcessW",
                        "CreateThread",
                        "DeleteFileW",
                        "ExitProcess",
                        "ExpandEnvironmentStringsW",
                    ],
                },
            ],
        },
    },
    null,
    4
);

export default function MarkedAttribute() {
    const [templateInput, setTemplateInput] = useState(demoTemplate);
    const [valueInput, setValueInput] = useState(demoValue);
    const [tokens, renderedValue] = renderValue(templateInput, valueInput);

    return (
        <View ident="attributePreview">
            <h5>Attribute rendering playground</h5>
            <div className="row">
                <div className="col-6">
                    <strong>template</strong>
                    <AceEditor
                        mode="text"
                        theme="github"
                        value={templateInput}
                        wrapEnabled
                        width="100%"
                        fontSize="16px"
                        onChange={(newTemplate) =>
                            setTemplateInput(newTemplate)
                        }
                        setOptions={{
                            useWorker: false,
                        }}
                    />
                </div>
                <div className="col-6">
                    <strong>value</strong>
                    <AceEditor
                        mode="json"
                        theme="github"
                        value={valueInput}
                        wrapEnabled
                        width="100%"
                        fontSize="16px"
                        onChange={(newValue) => setValueInput(newValue)}
                        setOptions={{
                            useWorker: false,
                        }}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <strong>render</strong>
                    <DataTable>
                        <tr>
                            <th>My attribute</th>
                            <td>{renderedValue}</td>
                        </tr>
                    </DataTable>
                </div>
            </div>
            <AceEditor
                mode="json"
                theme="github"
                value={JSON.stringify(tokens, null, 4)}
                wrapEnabled
                width="100%"
                fontSize="16px"
                readOnly
                setOptions={{
                    useWorker: false,
                }}
            />
        </View>
    );
}
