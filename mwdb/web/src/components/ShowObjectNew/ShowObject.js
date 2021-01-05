import React, {useEffect, useReducer} from 'react';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import ObjectBox from './ObjectBox';
// todo: all boxes need to be rewritten to independent components
import MultiRelationsBox from '../Relations';
import CommentBox from '../Comments';
import TagBox from '../Tag';
import ShareBox from "../Shares";
import AttributesBox from "../AttributesBox"

import api from "@mwdb-web/commons/api";
import { ShowObjectContext } from "@mwdb-web/commons/context";
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
            return { objectError: action.error, ...state }
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

    const ObjectLayout = () => (
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
                                        {props.children}
                                    </ObjectBox>
                                </Extendable>
                            </div>
                            <ShareBox />
                        </Extendable>
                    </div>
                    <div className="col-md-5">
                        <Extendable ident="showObjectRightColumn">
                            <TagBox id={objectState.object.id} searchEndpoint={props.searchEndpoint}/>
                            <MultiRelationsBox id={objectState.object.id} parents={objectState.object.parents} children={objectState.object.children}
                                               onObjectUpdate={objectState.updateObject}/>
                            <AttributesBox {...objectState.object}/>
                            <CommentBox id={objectState.object.id}/>
                        </Extendable>
                    </div>
                </div>
            </Extendable>
        </div>    
    )

    return (
        <ShowObjectContext.Provider value={{
            object: objectState.object,
            objectError: objectState.objectError,
            objectType: props.objectType,
            updateObject,
            setObjectError
        }}>
            <View fluid ident={props.ident} error={objectState.objectError}>
                { objectState.object ? <ObjectLayout/> : [] }
            </View>
        </ShowObjectContext.Provider>
    );
}
