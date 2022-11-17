import React from "react";
import Mustache from "mustache";
import { lexer, defaults, Tokenizer } from "marked";
import { DataTable } from "@mwdb-web/commons/ui";
import { escapeSearchValue } from "@mwdb-web/commons/helpers";
import { Link } from "react-router-dom";

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

function appendToLastElement(array, value) {
    // (["a", "b", "c"], "d") => ["a", "b", "cd"]
    return [...array.slice(0, -1), array[array.length - 1] + value];
}

function splitName(name) {
    if (name === ".")
        // Special case for "this"
        return [];
    return name
        .split(/(?<!\\)((?:\\\\)*[.])/g)
        .reduce((acc, current, index) => {
            const unescapedCurrent = current.replaceAll(/\\([.\\])/g, "$1");
            if (index % 2) {
                // Last character is a dot, rest must be appended to last element
                const currentWithoutLast = unescapedCurrent.slice(0, -1);
                return appendToLastElement(acc, currentWithoutLast);
            } else {
                // Regular name part
                return [...acc, unescapedCurrent];
            }
        }, []);
}

function makeQuery(path, value, attributeKey) {
    if (path[0] !== "value" && path[0] !== "value*")
        /**
         * TODO: value* should be interpreted as attribute.<attributeKey>*
         * but that form is currently unsupported by backend
         */
        return undefined;
    const queryPath = ["attribute", attributeKey, ...path.slice(1)].join(".");
    return `${queryPath}:${escapeSearchValue(value)}`;
}

class SearchReference {
    constructor(query, value) {
        this.query = query;
        this.value = value;
    }

    toMarkdown() {
        return `[${escapeMarkdown(this.value)}](search#${escapeMarkdown(
            this.query
        )})`;
    }
}

function escapeMarkdown(string) {
    // Escape Markdown characters
    // https://www.markdownguide.org/basic-syntax/#escaping-characters
    return String(string).replace(/([\\`*_{}[\]<>()#+-,!|])/g, "\\$1");
}

// Extended context to provide special Mustache values in future
class MustacheContext extends Mustache.Context {
    constructor(view, parent, globalView) {
        super(view, parent);
        this.globalView = globalView === undefined ? view : globalView;
        // Stored absolute path of last lookup
        this.lastPath = null;
        // Stored value from last lookup to determine the type
        this.lastValue = null;
    }

    push(view) {
        return new MustacheContext(view, this, this.globalView);
    }

    getParentPath() {
        if (!this.parent) return [];
        const parentPath = this.parent.lastPath;
        if (Array.isArray(this.parent.lastValue))
            // If last value is array, add array operator to the last path element
            return appendToLastElement(parentPath, "*");
        return parentPath;
    }

    lookup(name) {
        let searchable = false;
        // Check for searchable mark at the beginning
        if (name[0] === "@") {
            name = name.slice(1);
            searchable = true;
        }
        if (!name) return undefined;
        const path = splitName(name);
        let currentObject = this.view;
        console.log("currentObject", currentObject, path);
        for (let element of path) {
            if (!Object.prototype.hasOwnProperty.call(currentObject, element))
                return undefined;
            currentObject = currentObject[element];
        }
        this.lastPath = this.getParentPath().concat(path);
        this.lastValue = currentObject;
        if (searchable) {
            if (
                typeof currentObject === "object" ||
                typeof currentObject === "function"
            )
                // Non-primitives are not directly searchable
                return undefined;
            const query = makeQuery(
                this.lastPath,
                currentObject,
                this.globalView["key"]
            );
            if (!query) return undefined;
            return new SearchReference(query, currentObject);
        }
        return currentObject;
    }
}

// Extended Writer to escape Markdown characters instead of HTML
class MustacheWriter extends Mustache.Writer {
    getConfigEscape() {
        // Override default (HTML) escape function
        return escapeMarkdown;
    }

    escapedValue(token, context) {
        // https://github.com/janl/mustache.js/blob/550d1da9e3f322649d04b4795f5356914f6fd7e8/mustache.js#L663
        const value = context.lookup(token[1]);
        if (value instanceof SearchReference) {
            return value.toMarkdown();
        } else if (value != null)
            return typeof value === "number"
                ? String(value)
                : escapeMarkdown(value);
    }

    render(template, view) {
        return super.render(template, new MustacheContext(view, null));
    }
}

// Overrides to not use HTML escape
// https://github.com/markedjs/marked/blob/e3f8cd7c7ce75ce4f7e22bd082c45deb1678846d/src/Tokenizer.js#L67
class MarkedTokenizer extends Tokenizer {
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

const mustacheWriter = new MustacheWriter();
const markedTokenizer = new MarkedTokenizer();

// Custom renderer into React components
function renderTokens(tokens, options) {
    const renderers = {
        text(token) {
            return token.tokens
                ? renderTokens(token.tokens, options)
                : token.text;
        },
        escape(token) {
            return token.text;
        },
        strong(token) {
            return <strong>{renderTokens(token.tokens, options)}</strong>;
        },
        em(token) {
            return <em>{renderTokens(token.tokens, options)}</em>;
        },
        del(token) {
            return <del>{renderTokens(token.tokens, options)}</del>;
        },
        hr(token) {
            return <hr />;
        },
        blockquote(token) {
            return (
                <blockquote className="blockquote">
                    {renderTokens(token.tokens, options)}
                </blockquote>
            );
        },
        paragraph(token) {
            return (
                <p style={{ margin: "0" }}>
                    {renderTokens(token.tokens, options)}
                </p>
            );
        },
        link(token) {
            if (token.href.startsWith("search#")) {
                const query = token.href.slice("search#".length);
                const search =
                    "?" + new URLSearchParams({ q: query }).toString();
                return (
                    <Link
                        to={{
                            pathname: options.searchEndpoint,
                            search,
                        }}
                    >
                        {renderTokens(token.tokens, options)}
                    </Link>
                );
            }
            return (
                <a href={token.href}>{renderTokens(token.tokens, options)}</a>
            );
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
                                <th>{renderTokens(head.tokens, options)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {token.rows.map((row) => (
                            <tr>
                                {row.map((cell) => (
                                    <td>
                                        {renderTokens(cell.tokens, options)}
                                    </td>
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

export function renderValue(template, value, options) {
    const markdown = mustacheWriter.render(template, value);
    const tokens = lexer(markdown, {
        ...defaults,
        tokenizer: markedTokenizer,
    });
    return <div>{renderTokens(tokens, options)}</div>;
}
