import { useState, useEffect, useCallback, useContext } from "react";

import { APIContext } from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { SharesList } from "../common/SharesList";
import { SharingStatusIcon } from "../common/SharingStatusIcon";

export function SharesBox() {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);

    const [groups, setGroups] = useState([]);
    const [shareReceiver, setShareReceiver] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const objectId = context.object.id;
    const shares = context.object.shares;
    const { setObjectError, updateObjectData } = context;

    async function updateShares() {
        try {
            let response = await api.getObjectShares(objectId);
            setGroups(response.data.groups);
            updateObjectData({
                shares: response.data.shares,
            });
        } catch (error) {
            setObjectError(error);
        }
    }

    async function doShare(group) {
        try {
            setIsModalOpen(false);
            await api.shareObjectWith(objectId, group);
            updateShares();
        } catch (error) {
            setObjectError(error);
        }
    }

    function handleShare(group) {
        setIsModalOpen(true);
        setShareReceiver(group);
    }

    const getShares = useCallback(updateShares, [
        api,
        objectId,
        setObjectError,
        updateObjectData,
    ]);

    useEffect(() => {
        getShares();
    }, [getShares]);

    return (
        <div>
            <div className="card card-default">
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onRequestClose={() => setIsModalOpen(false)}
                    message={`Share the sample and all its descendants with ${shareReceiver}?`}
                    onConfirm={() => doShare(shareReceiver)}
                    confirmText="Share"
                    buttonStyle="bg-success"
                />

                <div className="card-header">
                    <div className="media">
                        <div className="align-self-center media-body">
                            Shares
                        </div>
                        <SharingStatusIcon shares={shares} />
                    </div>
                </div>
                <SharesList
                    shares={shares}
                    groups={groups}
                    handleShare={!api.remote ? handleShare : null}
                    currentFile={context.object.id}
                    direct
                />
            </div>
            <div className="card card-default">
                <div className="card-header">
                    <div className="media">
                        <div className="align-self-center media-body">
                            Inherited shares
                        </div>
                    </div>
                </div>
                <SharesList
                    shares={shares}
                    groups={groups}
                    currentFile={context.object.id}
                />
            </div>
        </div>
    );
}
