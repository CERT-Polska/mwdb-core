import React, {useEffect, useReducer} from 'react';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import ObjectBox from './Views/ObjectBox';
// todo: all boxes need to be rewritten to independent components
import MultiRelationsBox from '../Relations';
import CommentBox from './Views/CommentBox';
import TagBox from './Views/TagBox';
import ShareBox from "../Shares";
import AttributesBox from "./Views/AttributesBox"

import api from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/extensions";
import { View } from "@mwdb-web/commons/ui";

const initialObjectState = {
    object: null,
    objectError: null
}

const objectUpdate = Symbol("objectUpdate");
const objectError = Symbol("objectError");

function objectStateReducer(state, action) {
    switch(action.type) {
        case objectUpdate:
            return { object: action.object, objectError: null }
        case objectError:
            return { object: state.object, objectError: action.error}
        default:
            return state
    }
}

export default function ShowObject(props) {
    const [objectState, setObjectState] = useReducer(objectStateReducer, initialObjectState)

    function setObjectError(error) {
        setObjectState({
            type: objectError, error
        })
    }

    async function updateObject() {
        try {
            let response = await api.getObject(props.objectType, props.objectId);
            setObjectState({
                type: objectUpdate,
                object: response.data
            })
        } catch(error) {
            setObjectError(error);
        }
    }

    useEffect(() => {
        updateObject();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.objectId])

    const objectLayout = (
        objectState.object
        ? (
            <div className="card-body">
                <Extendable ident="showObject">
                    <div className="row">
                        <div className="col-md-7">
                            <Extendable ident="showObjectLeftColumn">
                                <div className="card">
                                    <Extendable ident="showObjectPresenter">
                                        <div className="card-header detailed-view-header">
                                            <FontAwesomeIcon icon={props.headerIcon}/>
                                            {props.headerCaption}
                                        </div>
                                        <ObjectBox defaultTab={props.defaultTab || "details"}>
                                            <Extendable ident="showObjectTabs">
                                                {props.children}
                                            </Extendable>
                                        </ObjectBox>
                                    </Extendable>
                                </div>
                                <ShareBox id={objectState.object.id}/>
                            </Extendable>
                        </div>
                        <div className="col-md-5">
                            <Extendable ident="showObjectRightColumn">
                                <TagBox />
                                <MultiRelationsBox id={objectState.object.id} parents={objectState.object.parents} children={objectState.object.children}
                                                onObjectUpdate={objectState.updateObject}/>
                                <AttributesBox />
                                <CommentBox />
                            </Extendable>
                        </div>
                    </div>
                </Extendable>
            </div>
        ) : []
    )

    return (
        <ObjectContext.Provider value={{
            object: objectState.object,
            objectError: objectState.objectError,
            objectType: props.objectType,
            searchEndpoint: props.searchEndpoint,
            updateObject,
            setObjectError
        }}>
            <View fluid ident={props.ident} error={objectState.objectError}>
                { objectLayout }
            </View>
        </ObjectContext.Provider>
    );
}
