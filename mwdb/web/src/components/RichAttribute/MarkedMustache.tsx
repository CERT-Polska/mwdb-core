import Mustache, { Context } from "mustache";
import { marked, Tokenizer } from "marked";
import {
    escapeSearchValue,
    Option,
    renderTokens,
    Token,
} from "@mwdb-web/commons/helpers";

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

function appendToLastElement(array: string[], value: string) {
    // (["a", "b", "c"], "d") => ["a", "b", "cd"]
    return [...array.slice(0, -1), array[array.length - 1] + value];
}

function splitName(name: string) {
    if (name === ".")
        // Special case for "this"
        return [];
    return name
        .split(/(?<!\\)((?:\\\\)*[.])/g)
        .reduce((acc: string[], current: string, index: number) => {
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

function makeQuery(path: string[], value: string, attributeKey: string) {
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
    query: string;
    value: string;
    constructor(query: string, value: string) {
        this.query = query;
        this.value = value;
    }

    toMarkdown() {
        return `[${escapeMarkdown(this.value)}](search#${escapeMarkdown(
            encodeURIComponent(this.query)
        )})`;
    }
}

function escapeMarkdown(string: string) {
    // Escape Markdown characters
    // https://www.markdownguide.org/basic-syntax/#escaping-characters
    return String(string).replace(/([\\`*_{}[\]<>()#+-,!|])/g, "\\$1");
}

// Extended context to provide special Mustache values in future
class MustacheContext extends Mustache.Context {
    globalView: any;
    lastPath: string[] | null;
    lastValue: string | null;
    constructor(view: Object, parent?: Context, globalView?: any) {
        super(view, parent);
        this.globalView = globalView === undefined ? view : globalView;
        // Stored absolute path of last lookup
        this.lastPath = null;
        // Stored value from last lookup to determine the type
        this.lastValue = null;
    }

    push(view: Object): Context {
        return new MustacheContext(view, this, this.globalView);
    }

    getParentPath() {
        if (!this.parent) return [];
        const parentContext = this.parent as MustacheContext;
        const parentPath = parentContext.lastPath;
        if (Array.isArray(parentContext.lastValue))
            // If last value is array, add array operator to the last path element
            return appendToLastElement(parentPath!, "*");
        return parentPath;
    }

    lookup(name: string) {
        let searchable = false;
        // Check for searchable mark at the beginning
        if (name[0] === "@") {
            name = name.slice(1);
            searchable = true;
        }
        if (!name) return undefined;
        const path = splitName(name);
        let currentObject = this.view;
        for (let element of path) {
            if (!Object.prototype.hasOwnProperty.call(currentObject, element))
                return undefined;
            currentObject = currentObject[element];
        }
        this.lastPath = this.getParentPath()!.concat(path);
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

    escapedValue(token: string[], context: Context) {
        // https://github.com/janl/mustache.js/blob/550d1da9e3f322649d04b4795f5356914f6fd7e8/mustache.js#L663
        const value = context.lookup(token[1]);
        if (value instanceof SearchReference) {
            return value.toMarkdown();
        } else if (value != null)
            return typeof value === "number"
                ? String(value)
                : escapeMarkdown(value);
        return "";
    }

    render(template: string, view: Object) {
        return super.render(template, new MustacheContext(view));
    }
}

// Overrides to not use HTML escape
// https://github.com/markedjs/marked/blob/e3f8cd7c7ce75ce4f7e22bd082c45deb1678846d/src/Tokenizer.js#L67
class MarkedTokenizer extends Tokenizer {
    rules: any;
    escape(src: string): any {
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

    codespan(src: string): any {
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

    inlineText(src: string, smartypants: (cap: string) => string): any {
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

export function renderValue(template: string, value: Object, options: Option) {
    const markdown = mustacheWriter.render(template, value);
    const tokens = marked.lexer(markdown, {
        ...marked.defaults,
        tokenizer: markedTokenizer,
    }) as Token[];
    return <div>{renderTokens(tokens, options)}</div>;
}
