function noop() {}

export type LambdaFunction = (
    this: object,
    input: any,
    options: { callType: "section" | "pipeline"; renderer?: Function }
) => any;

export const builtinLambdas = {
    makeTable: noop,
    makeList: noop,
    count: noop,
    sort: noop,
};
