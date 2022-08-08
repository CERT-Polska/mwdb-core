import React, { useState, useEffect } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

class HexViewNumberRenderer {
    getText(session, row) {
        return (row << 4).toString(16).padStart(8, "0");
    }

    getWidth(session, lastLineNumber, config) {
        return (
            Math.max(
                this.getText(session, lastLineNumber).length,
                this.getText(session, config.lastRow + 1).length,
                2
            ) * config.characterWidth
        );
    }

    update(e, editor) {
        editor.renderer.$loop.schedule(editor.renderer.CHANGE_GUTTER);
    }

    attach(editor) {
        editor.renderer.$gutterLayer.$renderer = this;
        editor.on("changeSelection", this.update);
        this.update(null, editor);
    }

    detach(editor) {
        if (editor.renderer.$gutterLayer.$renderer === this)
            editor.renderer.$gutterLayer.$renderer = null;
        editor.off("changeSelection", this.update);
        this.update(null, editor);
    }
}

export default function HexView(props) {
    const [originalContent, setOriginalContent] = useState(null);
    const [hexlifiedContent, setHexlifiedContent] = useState(null);
    let editorRef = React.createRef()
    let numberRenderer = new HexViewNumberRenderer();

    useEffect(() => {
        if (editorRef.current !== null) {
            let editor = editorRef.current.editor;
            editor.gotoLine(1);
            if (props.mode === "hex") numberRenderer.attach(editor);
        }
    }, []);

    useEffect(() => {
        if (editorRef.current !== null) {
            let editor = editorRef.current.editor;
            if (props.mode === "hex") numberRenderer.detach(editor);
            else numberRenderer.attach(editor);
        }
    });

    const content = () => {
        let rows = [];
        if (!props.content) return "";
        if (props.mode === "raw") {
            if (props.content instanceof ArrayBuffer)
                return new TextDecoder().decode(props.content);
            else return props.content;
        }
        if (!hexlifiedContent || originalContent !== props.content) {
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
            setOriginalContent(props.content);
            setHexlifiedContent(rows.join("\n"));
        }
        return hexlifiedContent;
    };

    return (
        <AceEditor
            ref={editorRef}
            mode={props.json ? "json" : "text"}
            theme="github"
            name="blob-content"
            value={content}
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
