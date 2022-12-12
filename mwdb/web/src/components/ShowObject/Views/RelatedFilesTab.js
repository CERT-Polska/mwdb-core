import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";

import { faPlus, faExternalLinkSquare } from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ObjectTab } from "@mwdb-web/commons/ui";
import { APIContext } from "@mwdb-web/commons/api/context";

function RelatedFileItem({ file_name, file_size, sha256 }){
    console.log(file_name);
    return (
        <tr>
            <td>
                {file_name}
            </td>
            <td>
                {file_size}
            </td>
            <td>
                <Link
                    to={`/related_file/${sha256}/download`}
                >
                    Pobierz
                </Link>
            </td>
        </tr>
    );
}

function ShowRelatedFiles(){
    const [relatedFiles, setRelatedFiles] = useState([]);

    async function updateRelatedFiles(){
        try{
            let response = await api.getListOfRelatedFiles(context.object.sha256);
            setRelatedFiles(response.data.related_files);
        } catch (error) {
            console.log(error);
        }
    }

    const api = useContext(APIContext);
    const context = useContext(ObjectContext);

    updateRelatedFiles();

    return (
        <table className="table table-striped table-bordered wrap-table share-table">
            {relatedFiles.map((related_file) => (
                <RelatedFileItem {...related_file} />
            ))}
        </table>
    );
}

export default function RelatedFilesTab(){
    return (
        <ObjectTab
            tab = "related_files"
            label = "Related files"
            icon = {faExternalLinkSquare}
            component = {ShowRelatedFiles}
            actions={[
                <ObjectAction label="Upload new" icon={faPlus} link="google.com" />,
            ]}
        />
    )
}