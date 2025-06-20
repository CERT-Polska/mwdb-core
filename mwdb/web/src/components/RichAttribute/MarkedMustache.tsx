import _, { uniqueId } from "lodash";
import Mustache, { Context } from "mustache";
import { marked, Tokenizer } from "marked";
import { fromPlugins } from "@mwdb-web/commons/plugins";
import { markdownRenderer, Token } from "./MarkdownRenderer";
import { builtinLambdas } from "./builtinLambdas";
import {
    LambdaRenderer,
    LambdaSet,
} from "@mwdb-web/components/RichAttribute/lambdaTypes";

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

function isFunction(obj: Object): boolean {
    return typeof obj === "function";
}

function splitByUnescapedSeparator(name: string, separator: string) {
    const splitRegex = new RegExp(
        String.raw`(?<!\\)((?:\\\\)*[${separator}])`,
        "g"
    );
    const replaceRegex = new RegExp(String.raw`\\([${separator}\\])`, "g");
    return name
        .split(splitRegex)
        .reduce((acc: string[], current: string, index: number) => {
            const unescapedCurrent = current.replaceAll(replaceRegex, "$1");
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

function splitName(name: string) {
    if (name === ".")
        // Special case for "this"
        return [];
    return splitByUnescapedSeparator(name, ".");
}

abstract class Reference {
    abstract toMarkdown(): string;
}

class LambdaResultReference extends Reference {
    resultId: string;

    constructor(resultId: string) {
        super();
        this.resultId = resultId;
    }

    toMarkdown(): string {
        return `[](lambda#${this.resultId})`;
    }
}

class SearchReference extends Reference {
    query: string;
    value: string;
    constructor(query: string, value: string) {
        super();
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
    renderContext: MarkedMustache;
    lambdaResults: { [id: string]: any };
    lambdaContext: { [key: string]: any };
    parentPath: string[];
    lastPath: string[];

    constructor(
        view: Object,
        renderContext: MarkedMustache,
        parent?: MustacheContext,
        initialPath?: string[]
    ) {
        super(view, parent);
        this.renderContext = renderContext;
        this.lambdaResults = parent ? parent.lambdaResults : {};
        this.lambdaContext = parent ? parent.lambdaContext : {};
        if (parent) {
            this.lambdaResults = parent.lambdaResults;
            this.lambdaContext = parent.lambdaContext;
            this.parentPath = parent.lastPath;
        } else {
            this.lambdaResults = {};
            this.lambdaContext = {};
            this.parentPath = initialPath || [];
        }
        this.lastPath = this.parentPath.slice();
    }

    push(view: Object): Context {
        // Creates new nested context (for section)
        return new MustacheContext(view, this.renderContext, this);
    }

    lookupView(name: string) {
        // Make a lookup within a view object
        if (!name) return undefined;
        const path = splitName(name);

        let currentObject = this.view;
        for (let element of path) {
            if (!Object.prototype.hasOwnProperty.call(currentObject, element)) {
                return undefined;
            }
            currentObject = currentObject[element];
        }

        this.lastPath = [...this.parentPath, ...path];
        if (Array.isArray(currentObject) && this.lastPath.length > 0) {
            this.lastPath[this.lastPath.length - 1] += "*";
        }
        return currentObject;
    }

    emitLambdaResult(result: any): any {
        if (typeof result !== "string") {
            let lambdaResultId = uniqueId("lambda_result");
            this.lambdaResults[lambdaResultId] = result;
            // Emit reference in markdown
            return new LambdaResultReference(lambdaResultId);
        } else {
            return result;
        }
    }

    resolveRenderer(lambda: LambdaRenderer, view?: any) {
        /**
         * Renderers are functions that are called by Writer.renderSection.
         * We use this mechanism to make lambda render part of the template by itself.
         * Lambda can also override rendering view.
         * https://github.com/janl/mustache.js/tree/master?tab=readme-ov-file#functions
         */
        const context = this;
        return function lambdaFunction(
            this: any,
            template: string,
            mustacheRenderer: (template: string, view?: any) => string
        ): string {
            const subrender = (template: string, view?: any) => {
                return context.renderContext.render(
                    template,
                    typeof view === "undefined" ? this : view,
                    context.lastPath
                );
            };
            const markdownRenderer = (markdown: string) => {
                return context.renderContext.renderMarkdown(
                    markdown,
                    context.lambdaResults
                );
            };
            let result = lambda.func.call(view ?? this, template, {
                renderer: subrender,
                mustacheRenderer,
                markdownRenderer,
                context,
            });
            let lambdaResult = context.emitLambdaResult(result);
            if (lambdaResult instanceof LambdaResultReference)
                return lambdaResult.toMarkdown();
            // If renderer returns a string, it's supposed to be Markdown output
            // No Markdown escaping is done here.
            else return lambdaResult;
        };
    }

    lookupLambda(name: string) {
        if (name.startsWith("$")) {
            // If you want to call lambda, but its name collides with
            // object key, you can alternatively put $ on the
            // beginning
            name = name.slice(1);
        }
        const lambda = this.renderContext.lambdas[name];
        if (!lambda) return undefined;
        if (lambda.lambdaType !== "renderer") return undefined;
        return this.resolveRenderer(lambda);
    }

    lookupPipeline(pipeline: string) {
        const [name, ...lambdaNames] = pipeline
            .split("|")
            .map((name) => name.trim());
        let result = this.lookupView(name);
        if (typeof result === "undefined") return undefined;
        // Only transformers are accepted in the middle of the pipeline can only be transformers
        for (let lambdaName of lambdaNames.slice(0, -1)) {
            const lambda = this.renderContext.lambdas[lambdaName];
            if (!lambda) return undefined;
            if (lambda.lambdaType !== "transformer") return undefined;
            result = lambda.func.call(this.view, result, {
                context: this,
            });
            if (typeof result === "undefined") return undefined;
        }
        // Then let's resolve last lambda depending on its time
        const lambda =
            this.renderContext.lambdas[lambdaNames[lambdaNames.length - 1]];
        if (!lambda) return undefined;
        if (lambda.lambdaType === "transformer") {
            result = lambda.func.call(this.view, result, {
                context: this,
            });
            return result;
        } else {
            return this.resolveRenderer(lambda, result);
        }
    }

    lookupSearchable(name: string) {
        if (!name) return undefined;
        let currentObject = this.lookupView(name);
        if (typeof currentObject === "undefined") return undefined;
        if (isFunction(currentObject) || typeof currentObject === "object")
            // Non-primitives are not directly searchable
            return undefined;
        const query = this.renderContext.options.makeQuery(
            this.lastPath,
            currentObject
        );
        if (!query) return undefined;
        return new SearchReference(query, currentObject);
    }

    lookup(name: string) {
        // Reset path before lookup
        this.lastPath = this.parentPath.slice();
        // Check for searchable mark at the beginning
        if (name[0] === "@") {
            // Searchable field mark
            name = name.slice(1);
            return this.lookupSearchable(name);
        } else if (name.includes("|")) {
            // Pipeline expression
            return this.lookupPipeline(name);
        }

        let object = this.lookupView(name);
        if (typeof object !== "undefined") return object;

        let lambda = this.lookupLambda(name);
        if (typeof lambda !== "undefined") return lambda;

        return undefined;
    }
}

// Extended Writer to escape Markdown characters instead of HTML
class MustacheWriter extends Mustache.Writer {
    getConfigEscape() {
        // Override default (HTML) escape function
        return escapeMarkdown;
    }

    renderSection(
        token: any,
        context: MustacheContext,
        partials: any,
        originalTemplate: string,
        config: any
    ): any {
        // https://github.com/janl/mustache.js/blob/972fd2b27a036888acfcb60d6119317744fac7ee/mustache.js#L585
        let buffer = "";
        let value = context.lookup(token[1]);

        if (!value) return;

        if (Array.isArray(value)) {
            for (let j = 0, valueLength = value.length; j < valueLength; ++j) {
                buffer += this.renderTokens(
                    token[4],
                    context.push(value[j]),
                    partials,
                    originalTemplate,
                    config
                );
            }
        } else if (
            typeof value === "object" ||
            typeof value === "string" ||
            typeof value === "number"
        ) {
            buffer += this.renderTokens(
                token[4],
                context.push(value),
                partials,
                originalTemplate,
                config
            );
        } else if (isFunction(value)) {
            const self = this;
            function subRender(template: string, view?: any): string {
                if (typeof view === "undefined")
                    return self.render(template, context, partials, config);
                else
                    return self.render(
                        template,
                        context.push(view),
                        partials,
                        config
                    );
            }

            // Extract the portion of the original template that the section contains.
            value = value.call(
                context.view,
                originalTemplate.slice(token[3], token[5]),
                subRender
            );

            if (value != null) buffer += value;
        } else {
            buffer += this.renderTokens(
                token[4],
                context,
                partials,
                originalTemplate,
                config
            );
        }
        return buffer;
    }

    escapedValue(token: string[], context: Context) {
        // https://github.com/janl/mustache.js/blob/550d1da9e3f322649d04b4795f5356914f6fd7e8/mustache.js#L663
        const value = context.lookup(token[1]);
        if (value instanceof Reference) {
            return value.toMarkdown();
        } else if (value != null)
            return typeof value === "number"
                ? String(value)
                : escapeMarkdown(value);
        return "";
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

type MarkedMustacheOptions = {
    searchEndpoint: string;
    lambdas: LambdaSet;
    makeQuery: (path: string[], value: any) => string | undefined;
};

class MarkedMustache {
    globalView: object;
    options: MarkedMustacheOptions;

    constructor(globalView: any, options: MarkedMustacheOptions) {
        this.globalView = globalView;
        this.options = options;
    }

    get lambdas() {
        return this.options.lambdas;
    }

    renderMarkdown(
        markdown: string,
        lambdaResults: { [id: string]: any }
    ): string {
        const tokens = marked.lexer(markdown, {
            ...marked.defaults,
            tokenizer: markedTokenizer,
        }) as Token[];
        return markdownRenderer(tokens, {
            searchEndpoint: this.options.searchEndpoint,
            lambdaResults: lambdaResults,
        });
    }

    render(template: string, view: object, initialPath?: string[]) {
        const context = new MustacheContext(view, this, undefined, initialPath);
        const markdown = mustacheWriter.render(template, context);
        return this.renderMarkdown(markdown, context.lambdaResults);
    }
}

export type RenderOptions = {
    searchEndpoint: string;
    makeQuery: (path: string[], value: any) => string | undefined;
};

export function renderValue(
    template: string,
    value: Object,
    options: RenderOptions
) {
    const pluginLambdas: LambdaSet[] = [
        builtinLambdas,
        ...fromPlugins("mustacheExtensions"),
    ];

    let lambdas = {};
    for (let lambdaSet of pluginLambdas) lambdas = { ...lambdas, ...lambdaSet };

    const markedMustache = new MarkedMustache(value, {
        searchEndpoint: options.searchEndpoint,
        lambdas,
        makeQuery: options.makeQuery,
    });
    return <div>{markedMustache.render(template, value)}</div>;
}
