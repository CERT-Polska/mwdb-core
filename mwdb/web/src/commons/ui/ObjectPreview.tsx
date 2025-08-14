import { useState, useMemo, useEffect, useCallback } from "react";
import AceEditor, { IEditorProps } from "react-ace";
import {
    formatHex,
    formatPrintable,
    formatRaw,
    ObjectContent,
} from "@mwdb-web/commons/helpers";

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

type Props = {
    content: ObjectContent;
    mode: string;
    showInvisibles: boolean;
    json?: boolean;
};

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
