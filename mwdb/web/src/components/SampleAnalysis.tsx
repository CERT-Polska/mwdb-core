import { useContext, useState } from "react";

import { ObjectContext } from "./ShowObject";

import { Extendable } from "@mwdb-web/commons/plugins";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { Attribute, KartonAnalysis, ObjectData } from "@mwdb-web/types/types";
import { renderValue } from "@mwdb-web/components/RichAttribute/MarkedMustache";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning, faCheck } from "@fortawesome/free-solid-svg-icons";
import AceEditor from "react-ace";

function isAnalysisPending(analyses?: KartonAnalysis[]): boolean {
    if (!analyses) return false;
    for (let analysis of analyses) {
        if (analysis.status === "running") return true;
    }
    return false;
}

function makeQuery(path: string[], value: string): string | undefined {
    return "";
}

type RendererObjectContext = Omit<ObjectData, "attributes"> & {
    attributes: { [key: string]: Attribute[] };
};

function transformObjectContext(objectData: ObjectData): RendererObjectContext {
    /***
     * This method transforms attributes into aggregated form instead of flat list
     */
    return {
        ...objectData,
        attributes: objectData.attributes.reduce(
            (prev: any, curr: Attribute): any => {
                if (!prev[curr.key]) {
                    // If key was seen first time: make single element array
                    return { ...prev, [curr.key]: [curr] };
                } else {
                    // Append into array otherwise
                    return { ...prev, [curr.key]: [...prev[curr.key], curr] };
                }
            },
            {}
        ),
    };
}

type SampleAnalysisPreviewProps = {
    richTemplate: string;
    objectContext: RendererObjectContext;
    searchEndpoint: string;
};

function SampleAnalysisPreview({
    richTemplate,
    objectContext,
    searchEndpoint,
}: SampleAnalysisPreviewProps) {
    const value = objectContext;
    try {
        return renderValue(richTemplate, value ?? {}, {
            searchEndpoint,
            makeQuery,
        });
    } catch (e) {
        return (
            <pre className="attribute-object" style={{ color: "red" }}>
                {"(template error)"} {JSON.stringify(value, null, 4)}
            </pre>
        );
    }
}

type RichAnalysisEditorProps = {
    template: string;
    onTemplateChange: (newTemplate: string) => any;
    context: RendererObjectContext;
};

export function RichAnalysisEditor({
    template,
    onTemplateChange,
    context,
}: RichAnalysisEditorProps) {
    return (
        <div className="row">
            <div className="col-6">
                <strong>Template</strong>
                <AceEditor
                    mode="markdown"
                    theme="github"
                    value={template}
                    wrapEnabled
                    width="100%"
                    fontSize="16px"
                    onChange={(newTemplate) => {
                        onTemplateChange(newTemplate);
                    }}
                    setOptions={{
                        useWorker: false,
                    }}
                />
            </div>
            <div className="col-6">
                <strong>Context</strong>
                <AceEditor
                    mode="json"
                    theme="github"
                    value={JSON.stringify(context, null, 4)}
                    wrapEnabled
                    readOnly
                    width="100%"
                    fontSize="16px"
                    setOptions={{
                        useWorker: false,
                    }}
                />
            </div>
        </div>
    );
}

const INITIAL_TEMPLATE = `
`;

export function SampleAnalysis() {
    const context = useContext(ObjectContext);
    const [template, setTemplate] = useState(INITIAL_TEMPLATE);

    if (!context) {
        return (
            <div className="mb-3 mt-2">
                <span
                    className="spinner-border spinner-border-sm mx-2"
                    role="status"
                />
                Loading object information...
            </div>
        );
    }
    const object = transformObjectContext(context.object as ObjectData);

    return (
        <>
            <RichAnalysisEditor
                template={template}
                onTemplateChange={setTemplate}
                context={object}
            />
            <Extendable ident="showSampleAnalysis">
                {isAnalysisPending(object.analyses) ? (
                    <div className="mb-3 mt-2">
                        <span
                            className="spinner-border spinner-border-sm mx-2"
                            role="status"
                        />
                        Analysis is still in progress. Results may not be
                        complete yet...
                    </div>
                ) : (
                    []
                )}
                <SampleAnalysisPreview
                    richTemplate={template}
                    objectContext={object}
                    searchEndpoint={context.searchEndpoint}
                />
            </Extendable>
        </>
    );
}
