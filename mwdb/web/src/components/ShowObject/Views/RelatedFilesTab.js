import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faExternalLinkSquare, faDownload } from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ObjectTab } from "@mwdb-web/commons/ui";
import { APIContext } from "@mwdb-web/commons/api/context";

function RelatedFileItem({ file_name, file_size, sha256 }){
    console.log(file_name);
    return (
        <tr class="flickerable">
            <td>
                {file_name}
            </td>
            <td>
                {file_size} B
            </td>
            <td>
                <Link
                    to={`/related_files/${sha256}/download`}
                    className="nav-link"
                    onClick={() => {

                    }}
                >
                    <FontAwesomeIcon icon={faDownload} size="1x"/>
                    &nbsp;Download
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

    const getRelatedFiles = useCallback(updateRelatedFiles, [
        api,
        context
    ]);

    useEffect(() => {
        getRelatedFiles();
    }, [getRelatedFiles]);

    return (
        <table className="table table-striped table-bordered table-hover data-table">
            <thead>
                <td>
                    File name
                </td>
                <td>
                    File size
                </td>
                <td>
                    Download
                </td>
            </thead>
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
                <ObjectAction label="Upload new" icon={faPlus} link="PUT_MODAL_HERE" />,
            ]}
        />
    )
}