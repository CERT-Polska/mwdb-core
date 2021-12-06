import React, {useState} from "react";
import AceEditor from "react-ace";
import Mustache from "mustache";
import {lexer} from "marked";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

import { DataTable, View } from "@mwdb-web/commons/ui";

class MarkedMustacheContext extends Mustache.Context {
    push(view) {
        return new MarkedMustacheContext(view, this)
    }

    lookup(name) {
        // Special handling of @ keys
        return super.lookup(name);
    }
}

class MarkedMustache extends Mustache.Writer {
    escapeMarkdown(string) {
        // Escape Markdown characters
        // https://www.markdownguide.org/basic-syntax/#escaping-characters
        return String(string).replace(/([\\`*_{}[\]<>()#+-,!|])/g, '\\$1');
    }

    getConfigEscape() {
        // Override default (HTML) escape function
        return this.escapeMarkdown;
    }

    render(template, view) {
        return super.render(
            template,
            new MarkedMustacheContext({
                ...JSON.parse(view)
            }, null)
        )
    }
}

const markedMustache = new MarkedMustache();

function renderTokens(tokens) {
    const renderers = {
        text(token) {
            console.log(token);
            return token.text;
        },
        escape(token) {
            console.log(token);
            return token.text;
        },
        strong(token) {
            return <strong>{renderTokens(token.tokens)}</strong>
        },
        em(token) {
            return <em>{renderTokens(token.tokens)}</em>
        },
        del(token) {
            return <del>{renderTokens(token.tokens)}</del>
        },
        blockquote(token) {
            return <blockquote className="blockquote">{renderTokens(token.tokens)}</blockquote>
        },
        paragraph(token) {
            return <p>{renderTokens(token.tokens)}</p>
        },
        link(token) {
            return <a href={token.href}>{renderTokens(token.tokens)}</a>
        },
        table(token) {
            return (
                <DataTable>
                    <thead>
                        <tr>
                        {
                            token.header.map((head) => <th>{renderTokens(head.tokens)}</th>)
                        }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            token.rows.map((row) => <tr>{
                                row.map((cell) => <td>{renderTokens(cell.tokens)}</td>)
                            }</tr>)
                        }
                    </tbody>
                </DataTable>
            )
        },
        codespan(token) {
            return <code>{token.text}</code>
        }
    }
    return tokens.map((token) => {
        const renderer = renderers[token.type];
        if(!renderer) {
            console.warn(`Marked: Unknown renderer for ${token.type}`)
            return [];
        }
        return renderer(token);
    })
}

function renderValue(template, value) {
    try {
        const markdown = markedMustache.render(template, value);
        const tokens = lexer(markdown);
        return renderTokens(tokens);
    } catch(e) {
        return [e.toString()];
    }
}

export default function AttributePreview()
{
    const [templateInput, setTemplateInput] = useState("");
    const [valueInput, setValueInput] = useState("");

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
                        onChange={(newTemplate) => setTemplateInput(newTemplate)}
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
                            <th>
                                My attribute
                            </th>
                            <td>
                                {
                                    renderValue(templateInput, valueInput)
                                }
                            </td>
                        </tr>
                    </DataTable>
                </div>
            </div>
        </View>
    );
}