export type LambdaRendererOptions = {
    renderer: (template: string, view?: any) => any;
    mustacheRenderer: (template: string, view?: any) => string;
    markdownRenderer: (markdown: string) => string;
    context: any;
};

export type LambdaTransformerOptions = {
    context: any;
};

export type LambdaRendererFunction = (
    this: any,
    template: string,
    options: LambdaRendererOptions
) => any;
export type LambdaTransformerFunction = (
    value: any,
    options: LambdaTransformerOptions
) => any;

export type LambdaRenderer = {
    func: LambdaRendererFunction;
    lambdaType: "renderer";
};

export type LambdaTransformer = {
    func: LambdaTransformerFunction;
    lambdaType: "transformer";
};

export type Lambda = LambdaRenderer | LambdaTransformer;

export function lambdaRenderer(func: LambdaRendererFunction): LambdaRenderer {
    return { func, lambdaType: "renderer" };
}

export function lambdaTransformer(
    func: LambdaTransformerFunction
): LambdaTransformer {
    return { func, lambdaType: "transformer" };
}

export type LambdaSet = { [name: string]: Lambda };
