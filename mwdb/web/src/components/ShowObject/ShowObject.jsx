import React, {
    useCallback,
    useEffect,
    useReducer,
    useContext,
    useMemo,
} from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ObjectBox from "./Views/ObjectBox";
import MultiRelationsBox from "./Views/RelationsBox";
import CommentBox from "./Views/CommentBox";
import ShareBox from "./Views/SharesBox";
import TagBox from "./Views/TagBox";
import AttributesBox from "./Views/AttributesBox";

import { APIContext } from "../../commons/api/context";
import { ConfigContext } from "../../commons/config";
import { ObjectContext } from "../../commons/context";
import { Extendable } from "../../commons/plugins";
import { View } from "../../commons/ui";
import KartonAnalysisBox from "./Views/KartonAnalysisBox";

const initialObjectState = {
    object: null,
    objectError: null,
};

const objectLoad = Symbol("objectLoad");
const objectUpdate = Symbol("objectUpdate");
const objectError = Symbol("objectError");

function objectStateReducer(state, action) {
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

export default function ShowObject({
    ident,
    objectType,
    objectId,
    headerIcon,
    headerCaption,
    defaultTab,
    children,
    searchEndpoint,
}) {
    const api = useContext(APIContext);
    const config = useContext(ConfigContext);
    const [objectState, setObjectState] = useReducer(
        objectStateReducer,
        initialObjectState
    );

    const setObjectError = useCallback(
        (error) =>
            setObjectState({
                type: objectError,
                error,
            }),
        []
    );

    const updateObject = useCallback(
        async (doLoad) => {
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

    const updateObjectData = useCallback((objectData) => {
        setObjectState({
            type: objectUpdate,
            object: objectData,
        });
    }, []);

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
                            <ShareBox />
                            <CommentBox />
                        </Extendable>
                    </div>
                </div>
            </Extendable>
        </div>
    ) : (
        []
    );

    const context = useMemo(
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
            <View fluid ident={ident} error={objectState.objectError}>
                {objectLayout}
            </View>
        </ObjectContext.Provider>
    );
}
