import {
    useCallback,
    useEffect,
    useReducer,
    useContext,
    useMemo,
    Reducer,
} from "react";
import { toast } from "react-toastify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ObjectBox } from "./ObjectBox";
import { MultiRelationsBox } from "./MultiRelationsBox";
import { CommentBox } from "./CommentBox";
import { SharesBox } from "./SharesBox";
import { TagBox } from "./TagBox";
import { AttributesBox } from "./AttributesBox";
import { Share3rdPartyBox } from "./Share3rdPartyBox";

import { APIContext } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/plugins";
import { View } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { KartonAnalysisBox } from "./KartonAnalysisBox";
import {
    BlobData,
    ConfigData,
    ObjectData,
    ObjectOrConfigOrBlobData,
    ObjectType,
} from "@mwdb-web/types/types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ObjectContextValues } from "@mwdb-web/types/context";

const objectLoad = Symbol("objectLoad");
const objectUpdate = Symbol("objectUpdate");
const objectError = Symbol("objectError");

type ObjectStateReducer = {
    object?: Partial<ObjectOrConfigOrBlobData>;
    objectError?: unknown;
};

type ObjectActionReducer = ObjectStateReducer & {
    type: typeof objectLoad | typeof objectUpdate | typeof objectError;
    error?: unknown;
};

function objectReducer(state: ObjectStateReducer, action: ObjectActionReducer) {
    switch (action.type) {
        case objectLoad:
            // Reload object and wipe lazy-loaded updates
            return { object: action.object, objectError: null };
        case objectUpdate:
            // Update object data with new information
            return {
                object: { ...state.object, ...action.object },
                objectError: null,
            };
        case objectError:
            return { object: state.object, objectError: action.error };
        default:
            return state;
    }
}

type Props = {
    ident: string;
    children: JSX.Element | JSX.Element[];
    objectType: ObjectType;
    headerIcon: IconDefinition;
    objectId: string;
    headerCaption: string;
    defaultTab?: string;
    searchEndpoint: string;
};

export function ShowObject(props: Props) {
    const {
        ident,
        objectType,
        objectId,
        headerIcon,
        headerCaption,
        defaultTab,
        children,
        searchEndpoint,
    } = props;
    const api = useContext(APIContext);
    const config = useContext(ConfigContext);
    const [objectState, setObjectState] = useReducer<
        Reducer<ObjectStateReducer, ObjectActionReducer>
    >(objectReducer, {});

    const setObjectError = useCallback((error: unknown) => {
        toast(getErrorMessage(error), {
            type: "error",
        });
        setObjectState({
            type: objectError,
            error,
        });
    }, []);

    const updateObject = useCallback(
        async (doLoad?: boolean) => {
            try {
                let response = await api.getObject(objectType, objectId);
                setObjectState({
                    type: doLoad ? objectLoad : objectUpdate,
                    object: response.data,
                });
            } catch (error) {
                setObjectError(error);
            }
        },
        [api, objectType, objectId, setObjectError]
    );

    const updateObjectData = useCallback(
        (objectData: Partial<ObjectData | ConfigData | BlobData>) => {
            setObjectState({
                type: objectUpdate,
                object: objectData,
            });
        },
        []
    );

    useEffect(() => {
        updateObject(true);
    }, [updateObject]);

    const objectLayout = objectState.object ? (
        <div className="show-object">
            <Extendable ident="showObject">
                <div className="row">
                    <div className="col-md-7">
                        <Extendable ident="showObjectLeftColumn">
                            <div className="card">
                                <Extendable ident="showObjectPresenter">
                                    <div className="card-header detailed-view-header">
                                        <FontAwesomeIcon icon={headerIcon} />
                                        {headerCaption}
                                    </div>
                                    <ObjectBox
                                        defaultTab={defaultTab || "details"}
                                    >
                                        <Extendable ident="showObjectTabs">
                                            {children}
                                        </Extendable>
                                    </ObjectBox>
                                </Extendable>
                            </div>
                            <AttributesBox />
                            {config.config
                                .is_3rd_party_sharing_consent_enabled && (
                                <Share3rdPartyBox
                                    isEnabled={
                                        objectState.object.share_3rd_party ??
                                        false
                                    }
                                    objectId={objectState.object.id ?? ""}
                                />
                            )}
                        </Extendable>
                    </div>
                    <div className="col-md-5">
                        <Extendable ident="showObjectRightColumn">
                            <TagBox />
                            <MultiRelationsBox />
                            {config.config["is_karton_enabled"] ? (
                                <KartonAnalysisBox />
                            ) : (
                                []
                            )}
                            <SharesBox />
                            <CommentBox />
                        </Extendable>
                    </div>
                </div>
            </Extendable>
        </div>
    ) : (
        []
    );

    const context: ObjectContextValues = useMemo(
        () => ({
            object: objectState.object,
            objectError: objectState.objectError,
            objectType: objectType,
            searchEndpoint: searchEndpoint,
            updateObject,
            updateObjectData,
            setObjectError,
        }),
        [
            objectState,
            objectType,
            searchEndpoint,
            updateObject,
            updateObjectData,
            setObjectError,
        ]
    );

    return (
        <ObjectContext.Provider value={context}>
            <View fluid ident={ident}>
                {objectLayout}
            </View>
        </ObjectContext.Provider>
    );
}
