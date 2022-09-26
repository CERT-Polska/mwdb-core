import React from "react";
import Mustache from "mustache";
import { lexer, defaults, Tokenizer } from "marked";
import { DataTable } from "@mwdb-web/commons/ui";

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

// Extended context to provide special Mustache values in future
class MarkedMustacheContext extends Mustache.Context {
    push(view) {
        return new MarkedMustacheContext(view, this);
    }

    lookup(name) {
        // Special handling of @ keys
        return super.lookup(name);
    }
}

// Extended Writer to escape Markdown characters instead of HTML
class MarkedMustache extends Mustache.Writer {
    static escapeMarkdown(string) {
        // Escape Markdown characters
        // https://www.markdownguide.org/basic-syntax/#escaping-characters
        return String(string).replace(/([\\`*_{}[\]<>()#+-,!|])/g, "\\$1");
    }

    getConfigEscape() {
        // Override default (HTML) escape function
        return MarkedMustache.escapeMarkdown;
    }

    render(template, view) {
        return super.render(template, new MarkedMustacheContext(view, null));
    }
}

// Overrides to not use HTML escape
// Based on: https://github.com/markedjs/marked/blob/e3f8cd7c7ce75ce4f7e22bd082c45deb1678846d/src/Tokenizer.js#L67
class MarkedMustacheTokenizer extends Tokenizer {
    escape(src) {
        const cap = this.rules.inline.escape.exec(src);
        if (cap) {
            return {
                type: "escape",
                raw: cap[0],
                text: cap[1],
            };
        }
        return false;
    }

    codespan(src) {
        const cap = this.rules.inline.code.exec(src);
        if (cap) {
            let text = cap[2].replace(/\n/g, " ");
            const hasNonSpaceChars = /[^ ]/.test(text);
            const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
            if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
                text = text.substring(1, text.length - 1);
            }
            return {
                type: "codespan",
                raw: cap[0],
                text,
            };
        }
    }

    inlineText(src, smartypants) {
        const cap = this.rules.inline.text.exec(src);
        if (cap) {
            let text = this.options.smartypants ? smartypants(cap[0]) : cap[0];
            return {
                type: "text",
                raw: cap[0],
                text,
            };
        }
    }
}

const markedMustache = new MarkedMustache();
const markedTokenizer = new MarkedMustacheTokenizer();

// Custom renderer into React components
function renderTokens(tokens) {
    const renderers = {
        text(token) {
            return token.tokens ? renderTokens(token.tokens) : token.text;
        },
        escape(token) {
            return token.text;
        },
        strong(token) {
            return <strong>{renderTokens(token.tokens)}</strong>;
        },
        em(token) {
            return <em>{renderTokens(token.tokens)}</em>;
        },
        del(token) {
            return <del>{renderTokens(token.tokens)}</del>;
        },
        hr(token) {
            return <hr />;
        },
        blockquote(token) {
            return (
                <blockquote className="blockquote">
                    {renderTokens(token.tokens)}
                </blockquote>
            );
        },
        paragraph(token) {
            return <p style={{ margin: "0" }}>{renderTokens(token.tokens)}</p>;
        },
        link(token) {
            return <a href={token.href}>{renderTokens(token.tokens)}</a>;
        },
        list(token) {
            return (
                <ul style={{ margin: "0" }}>
                    {token.items.map((item) => renderTokens([item]))}
                </ul>
            );
        },
        list_item(token) {
            return <li>{renderTokens(token.tokens)}</li>;
        },
        html(token) {
            return token.text;
        },
        table(token) {
            return (
                <DataTable>
                    <thead>
                        <tr>
                            {token.header.map((head) => (
                                <th>{renderTokens(head.tokens)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {token.rows.map((row) => (
                            <tr>
                                {row.map((cell) => (
                                    <td>{renderTokens(cell.tokens)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </DataTable>
            );
        },
        codespan(token) {
            return <code>{token.text}</code>;
        },
        code(token) {
            return <pre>{token.text}</pre>;
        },
        space() {
            return [];
        },
    };
    return tokens.map((token) => {
        const renderer = renderers[token.type];
        if (!renderer) {
            return [<i>{`(No renderer for ${token.type})`}</i>];
        }
        return renderer(token);
    });
}

export function renderValue(template, value) {
    const markdown = markedMustache.render(template, value);
    const tokens = lexer(markdown, {
        ...defaults,
        tokenizer: markedTokenizer,
    });
    return <div>{renderTokens(tokens)}</div>;
}
