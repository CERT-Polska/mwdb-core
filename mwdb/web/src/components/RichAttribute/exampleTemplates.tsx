function dedent<T>(templateStrings: TemplateStringsArray, ...values: T[]) {
    // Based on https://github.com/MartinKolarik/dedent-js
    let matches = [];
    let strings =
        typeof templateStrings === "string"
            ? [templateStrings]
            : templateStrings.slice();

    // 1. Remove trailing whitespace.
    strings[strings.length - 1] = strings[strings.length - 1].replace(
        /\r?\n([\t ]*)$/,
        ""
    );

    // 2. Find all line breaks to determine the highest common indentation level.
    for (let i = 0; i < strings.length; i++) {
        let match = strings[i].match(/\n[\t ]+/g);

        if (match) {
            matches.push(...match);
        }
    }

    // 3. Remove the common indentation from all strings.
    if (matches.length) {
        let size = Math.min(...matches.map((value) => value.length - 1));
        let pattern = new RegExp(`\n[\t ]{${size}}`, "g");

        for (let i = 0; i < strings.length; i++) {
            strings[i] = strings[i].replace(pattern, "\n");
        }
    }

    // 4. Remove leading whitespace.
    strings[0] = strings[0].replace(/^\r?\n/, "");

    // 5. Perform interpolation.
    let string = strings[0];

    for (let i = 0; i < values.length; i++) {
        string += values[i] + strings[i + 1];
    }

    return string;
}

export function makeContext<T>(attributeValue: T) {
    return {
        value: attributeValue,
        object: {
            type: "file",
            id: "a5e13ca10f702928e0de84c74d0ea8accb117fd76fbabc55220c75c4ffd596dc",
            md5: "8c515081584a38aa007909cd02020b3d",
            crc32: "4DDAB640",
            sha1: "ef5728c819f466bfe56c36bc9db3fac004ef3d50",
            sha256: "a5e13ca10f702928e0de84c74d0ea8accb117fd76fbabc55220c75c4ffd596dc",
            sha512: "dd4949a065889fbc5f43ddeda63d7e55ea25cf71c4f3b661fc2f8cd9f47d55f5ed68128094f01a08e7cafa9a98ad26256e3a1b121882f00e3c437a5a2da7bdc8",
            ssdeep: "384:ldr/SSVh5K+Xv9dFJ9Z7/wz5vX2PBw+VbeQ/locuhlbe1rzqZbN3e3CnyOSQKIo:lAshvXDMFvm59eQ/hAsr2Zbzf2AvH3",
            file_type: "PE32 executable (GUI) Intel 80386, for MS Windows",
            alt_names: [],
            tags: ["legit"],
            file_size: 44544,
            file_name: "ALG.exe",
            upload_time: "2018-05-18T13:35:41.086214+00:00",
        },
        key: "test-attribute",
    };
}

function makeValue<T>(attributeValue: T) {
    return JSON.stringify(attributeValue, null, 4);
}

const exampleTemplates = [
    {
        name: "Simple URL",
        template: dedent`
        [{{value}}](https://example.com/analysis/{{value}})
        `,
        value: makeValue("123456"),
    },
    {
        name: "URL with sample hash",
        template: dedent`
        [{{value}}](https://example.com/{{object.sha256}}/analysis/{{value}})
        `,
        value: makeValue("123456"),
    },
    {
        name: "Multi-value URL",
        template: dedent`
        [{{value.id}} ({{value.category}})](https://example.com/{{value.category}}/{{value.id}})
        `,
        value: makeValue({
            category: "analysis",
            id: 123456,
        }),
    },
    {
        name: "List of entries",
        template: dedent`
        {{#value}}
        - **{{dllname}}**
          {{#functions}}
            - {{.}}
          {{/functions}}
        {{/value}}
        `,
        value: makeValue([
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
        ]),
    },
    {
        name: "Table of entries",
        template: dedent`
        |Name|Virtual Address|Virtual Size|Raw Size|MD5|
        |----|---------------|------------|--------|---|
        {{#value.pe-sections}}
        |{{name}}|\`{{vaddr}}\`|\`{{vsize}}\`|\`{{psize}}\`|{{md5}}|
        {{/value.pe-sections}}
        `,
        value: makeValue({
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
        }),
    },
];

export default exampleTemplates;
