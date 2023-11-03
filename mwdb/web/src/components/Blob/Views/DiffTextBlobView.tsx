import { useCallback, useContext, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchangeAlt } from "@fortawesome/free-solid-svg-icons";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-chrome";

import { APIContext } from "@mwdb-web/commons/api";
import { View } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { useRemote } from "@mwdb-web/commons/remotes";
import { DiffTextBlobContentPresenter } from "../../DiffTextBlobContentPresenter";
import { BlobData } from "@mwdb-web/types/types";

export function DiffTextBlobView() {
    const remote = useRemote();
    const remotePath = remote ? `/remote/${remote}` : "";
    const api = useContext(APIContext);
    const { current: currentHash, previous: previousHash } = useParams();
    const [currentBlob, setCurrentBlob] = useState<BlobData | null>(null);
    const [previousBlob, setPreviousBlob] = useState<BlobData | null>(null);

    async function updateTextBlob() {
        try {
            const currentBlob = await api.getObject("blob", currentHash!);
            const previousBlob = await api.getObject("blob", previousHash!);
            setCurrentBlob(currentBlob.data as BlobData);
            setPreviousBlob(previousBlob.data as BlobData);
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    const getTextBlob = useCallback(updateTextBlob, [
        api,
        currentHash,
        previousHash,
    ]);

    useEffect(() => {
        getTextBlob();
    }, [getTextBlob]);

    return (
        <View ident="diffTextBlob" fluid>
            {currentBlob && previousBlob ? (
                <div className="card-body">
                    <div className="card-header">
                        <div className="media">
                            <div className="align-self-center media-body">
                                Blob diff
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <table
                                className="table table-striped table-bordered table-hover"
                                id="label-table"
                            >
                                <tbody>
                                    <tr>
                                        <th style={{ width: "49%" }}>
                                            <Link
                                                to={`${remotePath}/blob/${currentBlob.id}`}
                                            >
                                                {currentBlob.id}
                                            </Link>
                                        </th>
                                        <td>
                                            <Link
                                                to={`${remotePath}/diff/${previousBlob.id}/${currentBlob.id}`}
                                            >
                                                <button className="btn btn-primary">
                                                    <FontAwesomeIcon
                                                        icon={faExchangeAlt}
                                                        pull="left"
                                                    />
                                                </button>
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                to={`${remotePath}/blob/${previousBlob.id}`}
                                            >
                                                {previousBlob.id}
                                            </Link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <DiffTextBlobContentPresenter
                                current={currentBlob.content}
                                previous={previousBlob.content}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <></>
            )}
        </View>
    );
}
