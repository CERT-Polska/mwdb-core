import React, { Component } from "react";
import AceEditor from "react-ace";

import "brace/mode/text";
import "brace/mode/json";
import "brace/theme/github";
import "brace/ext/searchbox";

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

export default class HexView extends Component {
    constructor(props) {
        super(props);
        this.numberRenderer = new HexViewNumberRenderer();
        this.editor = React.createRef();
        this.originalContent = null;
        this.hexlifiedContent = null;
    }

    componentDidUpdate(prevProps) {
        let editor = this.editor.current.editor;
        if (this.props.mode !== prevProps.mode) {
            if (this.props.mode === "raw") this.numberRenderer.detach(editor);
            else this.numberRenderer.attach(editor);
        }
    }

    componentDidMount() {
        let editor = this.editor.current.editor;
        editor.gotoLine(1);
        if (this.props.mode === "hex") this.numberRenderer.attach(editor);
    }

    get content() {
        let rows = [];
        if (!this.props.content) return "";
        if (this.props.mode === "raw") {
            if (this.props.content instanceof ArrayBuffer)
                return new TextDecoder().decode(this.props.content);
            else return this.props.content;
        }
        if (
            !this.hexlifiedContent ||
            this.originalContent !== this.props.content
        ) {
            let content;
            if (this.props.content instanceof ArrayBuffer) {
                content = new Uint8Array(this.props.content);
            } else {
                content = new TextEncoder().encode(this.props.content);
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
            this.originalContent = this.props.content;
            this.hexlifiedContent = rows.join("\n");
        }
        return this.hexlifiedContent;
    }

    render() {
        return (
            <AceEditor
                ref={this.editor}
                mode={this.props.json ? "json" : "text"}
                theme="github"
                name="blob-content"
                value={this.content}
                readOnly
                wrapEnabled
                width="100%"
                fontSize="16px"
                setOptions={{
                    showInvisibles:
                        this.props.showInvisibles && this.props.mode !== "hex",
                }}
            />
        );
    }
}
