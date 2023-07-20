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

export function HexView(props: Props) {
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
            const numberRenderer = new HexViewNumberRenderer();
            numberRenderer.attach(editor);
            return () => {
                numberRenderer.detach(editor);
            };
        }
    }, [editor, props.mode]);

    const value = useMemo(() => {
        const rows = [];
        if (!props.content) return "";
        if (props.mode === "raw") {
            if (props.content instanceof ArrayBuffer)
                return new TextDecoder().decode(props.content);
            else return props.content;
        } else {
            let content;
            if (props.content instanceof ArrayBuffer) {
                content = new Uint8Array(props.content);
            } else {
                content = new TextEncoder().encode(props.content);
            }
            let byteRow = [];
            let asciiRow = [];
            for (let idx = 0; idx < content.length; idx++) {
                if (idx && idx % 16 === 0) {
                    rows.push(
                        byteRow.join(" ").padEnd(50, " ") + asciiRow.join("")
                    );
                    byteRow = [];
                    asciiRow = [];
                }
                byteRow.push(content[idx].toString(16).padStart(2, "0"));
                asciiRow.push(
                    content[idx] >= 0x20 && content[idx] <= 0x7e
                        ? String.fromCharCode(content[idx])
                        : "."
                );
            }
            if (byteRow.length > 0)
                rows.push(
                    byteRow.join(" ").padEnd(50, " ") + asciiRow.join("")
                );
            return rows.join("\n");
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
