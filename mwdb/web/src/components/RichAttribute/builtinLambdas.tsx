import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faWarning,
    faInfoCircle,
    faPlus,
    faMinus,
    faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
    lambdaRenderer,
    LambdaRendererOptions,
    LambdaSet,
    lambdaTransformer,
    LambdaTransformerOptions,
} from "@mwdb-web/components/RichAttribute/lambdaTypes";

const count = lambdaTransformer(function (input: any[]): any {
    return input.length;
});

const sort = lambdaTransformer(function (input: any[]): any {
    return input.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
});

const first = lambdaTransformer(function (input: any[]): any {
    if (input.length > 0) {
        return [input[0]];
    } else {
        return [];
    }
});

const last = lambdaTransformer(function (input: any[]): any {
    if (input.length > 0) {
        return [input[input.length - 1]];
    } else {
        return [];
    }
});

function renderParam(input: any, options: LambdaRendererOptions): any {
    // Renders section that is meant to be a parameter for another lambda.
    return options.mustacheRenderer(input).trim();
}

const groupBy = lambdaRenderer(function (
    key: any,
    options: LambdaRendererOptions
): any {
    options.context.lambdaContext["groupBy"] = renderParam(key, options);
    return "";
});

const group = lambdaTransformer(function (
    input: any[],
    options: LambdaTransformerOptions
): any {
    const groupBy = options.context.lambdaContext["groupBy"];
    let result: any = {};
    for (let item of input) {
        const key = item[groupBy];
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
});

const keys = lambdaTransformer(function (input: any): any {
    return Object.keys(input);
});

const values = lambdaTransformer(function (input: any): any {
    return Object.values(input);
});

const entries = lambdaTransformer(function (input: any): any {
    return Object.entries(input).map(([k, v]) => ({ key: k, value: v }));
});

const jsonify = lambdaTransformer(function (input: any[]): any {
    return JSON.stringify(input);
});

const uriencode = lambdaTransformer(function (input: any): any {
    return encodeURIComponent(input);
});

const _if = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    /**
     * {{if}} clauses are useful if you want to render something conditionally
     * Simple sections work the same, but then value references are in nested
     * contexts
     */
    options.context.lambdaContext["if"] = !!renderParam(text, options);
});

const _then = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    if (options.context.lambdaContext["if"]) return options.renderer(text);
    else return "";
});

const _else = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    if (!options.context.lambdaContext["if"]) return options.renderer(text);
    else return "";
});

const sectionHeader = lambdaRenderer(function (
    header: any,
    options: LambdaRendererOptions
): any {
    options.context.lambdaContext["sectionHeader"] = options.renderer(header);
    return "";
});

const section = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    return (
        <>
            <div className="py-2 pl-4 bg-light">
                <b>{options.context.lambdaContext["sectionHeader"]}</b>
            </div>
            {options.renderer(text)}
        </>
    );
});

const collapseHeader = lambdaRenderer(function (
    header: any,
    options: LambdaRendererOptions
): any {
    options.context.lambdaContext["collapseHeader"] =
        options.mustacheRenderer(header);
    return "";
});

const collapse = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    // We need to return a component here to be rendered by MarkdownRenderer
    const header = options.context.lambdaContext["collapseHeader"];
    return () => {
        const [collapsed, setCollapsed] = useState(true);
        return (
            <>
                <div
                    className="md-p-inline my-2"
                    onClick={() => setCollapsed((collapsed) => !collapsed)}
                    style={{ cursor: "pointer" }}
                >
                    <FontAwesomeIcon
                        className="mx-2"
                        icon={collapsed ? faPlus : faMinus}
                    />
                    {options.markdownRenderer(header)}
                </div>
                {!collapsed ? options.renderer(text) : []}
            </>
        );
    };
});

const indicatorType = lambdaRenderer(function (
    this: any,
    value: any,
    options: LambdaRendererOptions
): any {
    options.context.lambdaContext["indicatorType"] = renderParam(
        value,
        options
    );
});

const indicator = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
): any {
    const indicatorType = options.context.lambdaContext["indicatorType"];
    let icon = [];
    if (indicatorType == "success") {
        icon = [
            <FontAwesomeIcon icon={faCheck} className="text-success mx-2" />,
        ];
    } else if (indicatorType == "warning") {
        icon = [
            <FontAwesomeIcon icon={faWarning} className="text-warning mx-2" />,
        ];
    } else if (indicatorType == "danger") {
        icon = [
            <FontAwesomeIcon icon={faWarning} className="text-danger mx-2" />,
        ];
    } else {
        icon = [
            <FontAwesomeIcon
                icon={faInfoCircle}
                className="text-primary mx-2"
            />,
        ];
    }
    return (
        <div className="py-2 md-p-inline">
            {icon} {options.renderer(text)}
        </div>
    );
});

function indentedTrim(text: string) {
    let trimmed = "";
    for (let line of text.split(/\r?\n/)) {
        if (!trimmed && !line.trim()) continue;
        trimmed += line + "\n";
    }
    return trimmed.trimEnd();
}

const paginatedHeader = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
) {
    options.context.lambdaContext["paginatedHeader"] = indentedTrim(
        options.mustacheRenderer(text)
    );
    return "";
});

const paginated = lambdaRenderer(function (
    text: any,
    options: LambdaRendererOptions
) {
    const header = options.context.lambdaContext["paginatedHeader"];
    return () => {
        const [limit, setLimit] = useState(5);

        if (!Array.isArray(this)) return [];
        const elements = this.slice(0, limit).map((element) => {
            return indentedTrim(options.mustacheRenderer(text, element));
        });
        const partialElement = options.markdownRenderer(
            (header ? header + "\n" : "") + elements.join("\n")
        );
        return [
            partialElement,
            limit < this.length ? (
                <div
                    className="ml-4"
                    style={{ cursor: "pointer" }}
                    onClick={() => setLimit((limit) => limit + 10)}
                >
                    <FontAwesomeIcon icon={faChevronDown} className="mx-2" />
                    More ({this.length - limit})
                </div>
            ) : (
                []
            ),
        ];
    };
});

export const builtinLambdas: LambdaSet = {
    count,
    sort,
    first,
    last,
    group,
    keys,
    values,
    entries,
    jsonify,
    uriencode,
    "group.by": groupBy,
    "section.header": sectionHeader,
    section: section,
    "indicator.type": indicatorType,
    indicator: indicator,
    "collapse.header": collapseHeader,
    collapse,
    if: _if,
    then: _then,
    else: _else,
    "paginated.header": paginatedHeader,
    paginated: paginated,
};
