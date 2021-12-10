import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import {
    DateString,
    ConfirmationModal,
    Autocomplete,
    ShareReasonString,
} from "@mwdb-web/commons/ui";

function groupShares(shares) {
    function timeCompare(a, b) {
        const a_time = Date.parse(a.access_time);
        const b_time = Date.parse(b.access_time);
        // The same dhash order by time
        if (a_time > b_time) return 1;
        if (a_time < b_time) return -1;
        return 0;
    }
    // Sort by time
    const shares_by_time = shares.sort(timeCompare);
    // Group by reason
    const shares_by_reason = {};
    shares_by_time.forEach((share) => {
        const {
            related_object_dhash,
            related_object_type,
            related_user_login,
            reason_type,
        } = share;
        const reasonKey = `${related_object_dhash} ${related_object_type} ${related_user_login} ${reason_type}`;
        if (!shares_by_reason[reasonKey]) shares_by_reason[reasonKey] = [share];
        else {
            shares_by_reason[reasonKey].push(share);
        }
    });
    // Sort by first reason time
    return Object.values(shares_by_reason)
        .map((shares) => {
            const firstShare = shares[0];
            const reason = {
                reasonType: firstShare.reason_type,
                relatedObjectDHash: firstShare.related_object_dhash,
                relatedObjectType: firstShare.related_object_type,
                relatedUserLogin: firstShare.related_user_login,
            };
            return { reason, shares, access_time: firstShare.access_time };
        })
        .sort(timeCompare);
}

function ShareGroupItem({ reason, shares }) {
    const remotePath = useRemotePath();
    return (
        <table className="table table-striped table-bordered wrap-table share-table">
            <thead>
                <tr>
                    <th colSpan="2">
                        <ShareReasonString {...reason} />
                    </th>
                </tr>
            </thead>
            <tbody>
                {shares.map((share) => {
                    const isUploader =
                        share.related_user_login === share.group_name;
                    return (
                        <tr className="d-flex">
                            <td className="col-6">
                                <Link
                                    to={makeSearchLink(
                                        "uploader",
                                        share.group_name,
                                        false,
                                        `${remotePath}/search`
                                    )}
                                >
                                    {share.group_name}
                                </Link>
                                {isUploader && (
                                    <span className="ml-2">(uploader)</span>
                                )}
                            </td>
                            <td className="col">
                                <DateString date={share.access_time} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function ShareForm(props) {
    const [group, setGroup] = useState("");
    const groups = props.groups
        .sort()
        .filter(
            (item) => item.toLowerCase().indexOf(group.toLowerCase()) !== -1
        );

    function handleSubmit(e) {
        e.preventDefault();
        if (!group) return;
        props.onSubmit(group);
        setGroup("");
    }

    return (
        <form className="tagForm" onSubmit={handleSubmit}>
            <Autocomplete
                value={group}
                items={groups}
                onChange={(value) => setGroup(value)}
                className="form-control"
                placeholder="Share with group"
            >
                <div className="input-group-append">
                    <input
                        className="btn btn-outline-primary"
                        type="submit"
                        value="Add"
                    />
                </div>
            </Autocomplete>
        </form>
    );
}

function SharesBox() {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);

    const [groups, setGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [shareReceiver, setShareReceiver] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const objectId = context.object.id;
    const setObjectError = context.setObjectError;

    async function updateShares() {
        try {
            let response = await api.getObjectShares(objectId);
            setGroups(response.data.groups);
            setItems(response.data.shares);
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
    ]);

    useEffect(() => {
        getShares();
    }, [getShares]);

    const groupedItems = groupShares(items);

    // Icon showing the sharing status of the object
    const lockIcon = items.some((share) => share.group_name === "public")
        ? "lock-open"
        : "lock";

    const lockTooltip = items.some((share) => share.group_name === "public")
        ? "Object is shared with public"
        : "Object is not shared with public";

    return (
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
                    <div className="align-self-center media-body">Shares</div>
                    <span data-toggle="tooltip" title={lockTooltip}>
                        <FontAwesomeIcon
                            icon={lockIcon}
                            pull="left"
                            size="1x"
                            style={{ color: "grey", cursor: "pointer" }}
                        />
                    </span>
                </div>
            </div>
            {groupedItems.map((sharesGroup) => (
                <ShareGroupItem {...sharesGroup} />
            ))}
            {!api.remote ? (
                <ShareForm onSubmit={handleShare} groups={groups} />
            ) : (
                []
            )}
        </div>
    );
}

export default SharesBox;
