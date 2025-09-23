import moo from "moo";

const lexer = moo.states({
    expression: {
        expr_boolop: /(?:AND|OR)/,
        expr_notop: "NOT",
        expr_phrase: /"(?:\\.|[^\n"\\])*"/,
        expr_fieldsep: ".",
        expr_term: /(?:\w|\\.)+/,
        expr_arrayref: "*",
        expr_valuesep: { match: ":", next: "value" },
        expr_lpar: "(",
        expr_rpar: ")",
        expr_space: { match: /\s+/, lineBreaks: true },
    },
    value: {
        value_compop: /[><][=]?/,
        value_lrange: { match: /[\[{]/, next: "range" },
        value_lpar: { match: "(", next: "expression" },
        value_phrase: { match: /"(?:\\.|[^\n"\\])*"/, next: "expression" },
        value_term: { match: /(?:\w|\\.|[*?\-_.])+/, next: "expression" },
    },
    range: {
        range_rrange: { match: /[}\]]/, next: "expression" },
        range_toop: "TO",
        range_phrase: /"(?:\\["\\]|[^\n"\\])*"/,
        range_term: /(?:\w|[*?\-_.])+/,
        range_space: { match: /\s+/, lineBreaks: true },
    },
    unfinished_phrase: {},
});

const allowedStates: { [state: string]: { [expectedLexem: string]: string } } =
    {
        main: {
            expr_notop: "main",
            expr_lpar: "main",
            expr_space: "main",
            expr_phrase: "fieldsep",
            expr_term: "fieldsep",
        },
        fieldsep: {
            expr_valuesep: "value_start",
            expr_fieldsep: "fieldname",
            expr_arrayref: "fieldsep",
        },
        fieldname: {
            expr_phrase: "fieldsep",
            expr_term: "fieldsep",
        },
        value_start: {
            value_compop: "value",
            value_lrange: "range_start",
            value_lpar: "main",
            value_phrase: "value_end",
            value_term: "value_end",
        },
        value: {
            value_phrase: "value_end",
            value_term: "value_end",
        },
        value_end: {
            expr_boolop: "after_boolop",
            expr_space: "value_end",
            expr_rpar: "value_end",
        },
        after_boolop: {
            expr_space: "main",
            expr_lpar: "main",
        },
        range_start: {
            range_phrase: "range_to",
            range_term: "range_to",
        },
        range_to: {
            range_space: "range_to",
            range_toop: "range_end",
        },
        range_end: {
            range_space: "range_end",
            range_phrase: "range_fin",
            range_term: "range_fin",
        },
        range_fin: {
            range_space: "range_fin",
            range_rrange: "value_end",
        },
    };

export const LPAR_TYPES: string[] = ["expr_lpar", "value_lpar", "value_lrange"];
export const RPAR_TYPES: string[] = ["expr_rpar", "range_rrange"];
export const FIELD_TYPES: string[] = ["expr_phrase", "expr_term"];
export const FIELD_PART_TYPES: string[] = ["expr_arrayref", "expr_fieldsep"];
export const OPER_TYPES: string[] = [
    "expr_notop",
    "expr_boolop",
    "range_toop",
    "value_compop",
];

export function* lexQuery(
    query: string
): Generator<[moo.Token, string, string[]]> {
    let currentState = "main";
    lexer.reset(query);
    for (let token of lexer) {
        if (!token.type || !allowedStates[currentState][token.type])
            throw new Error(
                `${token.type} is not allowed in '${currentState}' state`
            );
        currentState = allowedStates[currentState][token.type];
        yield [token, currentState, Object.keys(allowedStates[currentState])];
    }
}

export type QueryAnnotation = {
    type: string;
    value: string;
    offset: number;
    lastOpenedBracket?: boolean;
    error?: string;
};

export type AnnotatedQuery = {
    annotations: QueryAnnotation[];
    nextPossibleTokens: string[];
};

export function annotateQuery(query: string): AnnotatedQuery {
    const annotations: QueryAnnotation[] = [];
    const openedParentheses: QueryAnnotation[] = [];

    let nextOffset = 0;
    let nextPossibleTokens: string[] = [];
    try {
        if (!query.length) {
            let _rest;
            [_rest, _rest, nextPossibleTokens] = lexQuery(" ").next().value;
        } else {
            for (const [token, _, nextTokens] of lexQuery(query)) {
                let tokenType: string = token.type as string;
                let annotation: QueryAnnotation = {
                    type: tokenType,
                    value: token.value,
                    offset: token.offset,
                };
                if (LPAR_TYPES.includes(tokenType)) {
                    if (openedParentheses.length > 0) {
                        openedParentheses[
                            openedParentheses.length - 1
                        ].lastOpenedBracket = false;
                    }
                    annotation.lastOpenedBracket = true;
                    openedParentheses.push(annotation);
                } else if (RPAR_TYPES.includes(tokenType)) {
                    openedParentheses[
                        openedParentheses.length - 1
                    ].lastOpenedBracket = false;
                    openedParentheses.pop();
                    if (openedParentheses.length > 0) {
                        openedParentheses[
                            openedParentheses.length - 1
                        ].lastOpenedBracket = true;
                    }
                }
                annotations.push(annotation);
                nextOffset = token.offset + token.value.length;
                nextPossibleTokens = nextTokens;
            }
        }
    } catch (e: any) {
        annotations.push({
            type: "error",
            value: query.slice(nextOffset),
            error: e.toString(),
            offset: nextOffset,
        });
        nextPossibleTokens = [];
    }
    return { annotations, nextPossibleTokens };
}
