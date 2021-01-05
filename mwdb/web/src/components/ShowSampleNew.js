import React from 'react';
import { ShowObject, ObjectTab, ObjectAction } from './ShowObjectNew';

export default function ShowSample(props) {
    return (
        <ShowObject 
            ident="showSample"
            objectType="file"
            objectId={props.match.params.hash}
            searchEndpoint=""
            headerIcon="file"
            headerCaption="File new view"
        >
            <ObjectTab 
                tab="details" 
                actions={[
                    <ObjectAction label="Alert me" action={()=> {alert("Hey you!");}}/>,
                    <ObjectAction label="Alert somebody" action={()=> {alert("Hey somebody!");}}/>
                ]}
                component={() => <div>Hello</div>}
            />
            <ObjectTab 
                tab="narcist" 
                actions={[
                    <ObjectAction label="Alert me" action={()=> {alert("Hey you!");}}/>
                ]}
            />
        </ShowObject>
    )
}