import Mustache from "mustache";
import {lexer, Tokenizer as MarkedTokenizer} from "marked";
import {DataTable} from "@mwdb-web/commons/ui";
import React from "react";

/**
 * Markdown with Mustache templates for React
 * Based on Marked (https://github.com/markedjs/marked) and
 * mustache.js library (https://github.com/janl/mustache.js)
 *
 * Applied modifications:
 * - Rendering React components for chosen Markdown language subset
 * - Support for arbitrary widgets
 * - Markdown-specific escaping instead of HTML-specific on Mustache level
 * - Removed HTML escaping on Marked level
 */

class MarkedMustacheContext extends Mustache.Context {
    push(view) {
        return new MarkedMustacheContext(view, this)
    }

    lookup(name) {
        // Special handling of @ keys
        return super.lookup(name);
    }
}

class MarkedMustacheTokenizer extends MarkedTokenizer {
    escape(src) {
        const cap = this.rules.inline.escape.exec(src);
        if(cap) {
            return {
                type: 'escape',
                raw: cap[0],
                text: cap[1]
            };
        }
    }

    codespan(src) {
        const cap = this.rules.inline.code.exec(src);
        if (cap) {
            let text = cap[2].replace(/\n/g, ' ');
            const hasNonSpaceChars = /[^ ]/.test(text);
            const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
                text = text.substring(1, text.length - 1);
            }
            return {
                type: 'codespan',
                raw: cap[0],
                text
            };
        }
    }

    widget(src) {
        const cap = src.match(/^<mustache-widget:([0-9a-f]{16})>/);
        if(cap) {
            return {
                type: 'widget',
                raw: cap[0],
                widgetId: cap[1]
            };
        }
    }

    inlineText(src, smartypants) {
        const cap = this.rules.inline.text.exec(src);
        if (cap) {
            let text;
            if (this.lexer.state.inRawBlock) {
                text = cap[0];
            } else {
                text = this.options.smartypants ? smartypants(cap[0]) : cap[0];
            }
            return {
                type: 'text',
                raw: cap[0],
                text
            };
        }
    }
}

class MarkedMustache extends Mustache.Writer {
    static escapeMarkdown(string) {
        // Escape Markdown characters
        // https://www.markdownguide.org/basic-syntax/#escaping-characters
        return String(string).replace(/([\\`*_{}[\]<>()#+-,!|])/g, '\\$1');
    }

    getConfigEscape() {
        // Override default (HTML) escape function
        return MarkedMustache.escapeMarkdown;
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