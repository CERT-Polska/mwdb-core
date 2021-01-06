import React, { useContext } from "react";

import { faDownload } from '@fortawesome/free-solid-svg-icons'

import { ObjectAction } from "./ObjectTab";

import { ObjectContext } from "@mwdb-web/commons/context";


export default function DownloadAction(props) {
    const context = useContext(ObjectContext);
    
    async function download() {
        try {
            await props.download(context.object);
        } catch(error) {
            context.setObjectError(error);
        }
    }

    return (
        <ObjectAction
            label="Download"
            icon={faDownload}
            action={download} 
        />
    )
}
