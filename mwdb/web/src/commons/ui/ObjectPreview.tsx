import { useState, useMemo, useEffect, useCallback } from "react";
import AceEditor, { IEditorProps } from "react-ace";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

class HexViewNumberRenderer {
    getText(session: any, row: number) {
        return (row << 4).toString(16).padStart(8, "0");
    }

    getWidth(
        session: any,
        lastLineNumber: number,
        config: { lastRow: number; characterWidth: number }
    ) {
        return (
            Math.max(
                this.getText(session, lastLineNumber).length,
                this.getText(session, config.lastRow + 1).length,
                2
            ) * config.characterWidth
        );
    }

    update(editor: IEditorProps) {
        if (editor)
            editor.renderer.$loop.schedule(editor.renderer.CHANGE_GUTTER);
    }

    attach(editor: IEditorProps) {
        editor.renderer.$gutterLayer.$renderer = this;
        editor.on("changeSelection", this.update);
        this.update(editor);
    }

    detach(editor: IEditorProps) {
        if (editor.renderer.$gutterLayer.$renderer === this)
            editor.renderer.$gutterLayer.$renderer = null;
        editor.off("changeSelection", this.update);
        this.update(editor);
    }
}

type Content = string | ArrayBuffer;

type Props = {
    content: Content;
    mode: string;
    showInvisibles: boolean;
    json?: boolean;
};

function extractPrintableSequences(
    units: number[],
    isPrintable: (u: number) => boolean,
    minLength: number = 4
): string {
    const result: string[] = [];
    let current: string[] = [];

    for (const u of units) {
        if (isPrintable(u)) {
            current.push(String.fromCharCode(u));
        } else {
            if (current.length >= minLength) result.push(current.join(""));
            current = [];
        }
    }
    if (current.length >= minLength) result.push(current.join(""));

    return result.join("\n");
}

function formatRaw(content: Content): string {
    if (content instanceof ArrayBuffer)
        return new TextDecoder().decode(content);
    return content;
}

function getArrayBuffer(content: Content): ArrayBuffer {
    return content instanceof ArrayBuffer
        ? content
        : new TextEncoder().encode(content).buffer;
}

function formatPrintable(
    content: Content,
    format: "UTF-8" | "UTF-16(LE)"
): string {
    let units: number[];
    let isPrintable: (u: number) => boolean;

    if (format === "UTF-16(LE)") {
        const buffer = getArrayBuffer(content);
        const totalUnits = Math.floor(buffer.byteLength / 2);
        const units16 = new Uint16Array(buffer, 0, totalUnits);
        units = Array.from(units16);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    } else {
        const buffer = new Uint8Array(getArrayBuffer(content));
        units = Array.from(buffer);
        isPrintable = (u) => u >= 0x20 && u <= 0x7e;
    }

    const sequences = extractPrintableSequences(units, isPrintable);
    if (!sequences) {
        return (
            `No ${format} characters to display in this mode.\n` +
            "Only printable ASCII characters (0x20–0x7E) are supported."
        );
    }
    return sequences;
}

function formatHex(content: Content): string {
    const bytes = new Uint8Array(getArrayBuffer(content));

    const rows: string[] = [];
    let byteRow: string[] = [];
    let asciiRow: string[] = [];

    for (let idx = 0; idx < bytes.length; idx++) {
        if (idx && idx % 16 === 0) {
            rows.push(byteRow.join(" ").padEnd(50, " ") + asciiRow.join(""));
            byteRow = [];
            asciiRow = [];
        }
        byteRow.push(bytes[idx].toString(16).padStart(2, "0"));
        asciiRow.push(
            bytes[idx] >= 0x20 && bytes[idx] <= 0x7e
                ? String.fromCharCode(bytes[idx])
                : "."
        );
    }

    if (byteRow.length > 0) {
        rows.push(byteRow.join(" ").padEnd(50, " ") + asciiRow.join(""));
    }

    return rows.join("\n");
}

export function ObjectPreview(props: Props) {
    const [editor, setEditor] = useState<IEditorProps | null>(null);

    const setEditorRef = useCallback((node: AceEditor) => {
        if (node) {
            setEditor(node.editor);
            node.editor.gotoLine(1, 0, false);
        } else {
            setEditor(null);
        }
    }, []);

    useEffect(() => {
        if (editor && props.mode === "hex") {
            const renderer = new HexViewNumberRenderer();
            renderer.attach(editor);
            return () => renderer.detach(editor);
        }
    }, [editor, props.mode]);

    const value = useMemo(() => {
        if (!props.content) return "";
        switch (props.mode) {
            case "raw":
                return formatRaw(props.content);
            case "strings":
                return formatPrintable(props.content, "UTF-8");
            case "widechar":
                return formatPrintable(props.content, "UTF-16(LE)");
            default:
                return formatHex(props.content);
        }
    }, [props.content, props.mode]);

    return (
        <AceEditor
            ref={setEditorRef}
            mode={props.json ? "json" : "text"}
            theme="github"
            name="blob-content"
            value={value}
            readOnly
            wrapEnabled
            width="100%"
            fontSize="16px"
            setOptions={{
                showInvisibles: props.showInvisibles && props.mode !== "hex",
                useWorker: false,
            }}
        />
    );
}
