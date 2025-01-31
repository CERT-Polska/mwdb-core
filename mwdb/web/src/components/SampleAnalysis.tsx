import { useContext, useState } from "react";

import { ObjectContext } from "./ShowObject";

import { Extendable } from "@mwdb-web/commons/plugins";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { KartonAnalysis, ObjectData } from "@mwdb-web/types/types";
import { renderValue } from "@mwdb-web/components/RichAttribute/MarkedMustache";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWarning,
    faCheck
} from "@fortawesome/free-solid-svg-icons";
import { ObjectContextValues } from "@mwdb-web/types/context";
import AceEditor from "react-ace";

function isAnalysisPending(analyses?: KartonAnalysis[]): boolean {
    if(!analyses)
        return false;
    for(let analysis of analyses) {
        if(analysis.status === "running")
            return true;
    }
    return false
}

type SampleAnalysisPreviewProps = {
    richTemplate: string;
    context: ObjectContextValues;
}

function SampleAnalysisPreview({richTemplate, context}: SampleAnalysisPreviewProps) {
    const value = context.object;
    try {
        return renderValue(richTemplate, value ?? {}, {
            searchEndpoint: context.searchEndpoint,
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
    template: string,
    onTemplateChange: (newTemplate: string) => any;
    context: any;
};

export function RichAnalysisEditor({template, onTemplateChange, context}: RichAnalysisEditorProps) {
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
                        onTemplateChange(newTemplate)
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
    const remotePath = useRemotePath();

    if (!context) {
        return (
            <div className="mb-3 mt-2">
                <span className="spinner-border spinner-border-sm mx-2" role="status" />
                Loading object information...
            </div>
        )
    }
    const object = context.object as ObjectData;

    return (
        <>
            <RichAnalysisEditor template={template} onTemplateChange={setTemplate} context={context.object}/>
            <Extendable ident="showSampleAnalysis">
                {
                    isAnalysisPending(object.analyses) ? (
                        <div className="mb-3 mt-2">
                            <span className="spinner-border spinner-border-sm mx-2" role="status" />
                            Analysis is still in progress. Results may not be complete yet...
                        </div>
                    ) : []
                }
                <SampleAnalysisPreview richTemplate={template} context={context} />
                <div className="py-2 pl-4 bg-light">
                    <b>Basic indicators</b>
                </div>
                <div className="py-2">
                    <FontAwesomeIcon icon={faWarning} className="text-danger mx-2" />
                    This is real shit
                </div>
                <div className="py-2">
                    <FontAwesomeIcon icon={faWarning} className="text-warning mx-2" />
                    It will crypt all your files in a second
                </div>
                <div className="py-2">
                    <FontAwesomeIcon icon={faCheck} className="text-success mx-2" />
                    Looks like nice malware though
                </div>
                <div className="py-2 pl-4 bg-light">
                    <b>Sandbox executions</b>
                </div>
                none
                <div className="py-2 pl-4 bg-light">
                    <b>Imports</b>
                </div>
            </Extendable>
        </>
    );
}
