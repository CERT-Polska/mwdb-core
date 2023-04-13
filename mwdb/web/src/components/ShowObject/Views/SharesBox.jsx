import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLockOpen, faLock } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
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
    function reasonAndTimeCompare(a, b) {
        // reasonTypes should be grouped (one after another)
        if (a.reason.reasonType > b.reason.reasonType) return 1;
        if (a.reason.reasonType < b.reason.reasonType) return -1;
        // if two shares have identical reasonType sort by time
        const a_time = Date.parse(a.access_time);
        const b_time = Date.parse(b.access_time);
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
        const reasonKey =
            reason_type === "shared"
                ? `${related_object_dhash} ${related_object_type} ${related_user_login} ${reason_type}`
                : `${related_object_dhash} ${related_object_type} ${reason_type}`;
        if (!shares_by_reason[reasonKey]) {
            shares_by_reason[reasonKey] = [share];
        } else {
            shares_by_reason[reasonKey].push(share);
        }
    });
    // Sort by reason and first reason time
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
        .sort(reasonAndTimeCompare);
}

function ShareGroupItem({ reason, shares, showDhash }) {
    const remotePath = useRemotePath();
    return (
        <table className="table table-striped table-bordered wrap-table share-table">
            <thead>
                <tr>
                    <th colSpan="2">
                        {(() => {
                            if (reason.relatedUserLogin !== "$hidden") {
                                return (
                                    <ShareReasonString
                                        {...reason}
                                        showDhash={showDhash}
                                    />
                                );
                            } else {
                                return (
                                    <span class="text-muted">
                                        You do not have permission to see the
                                        uploader.
                                    </span>
                                );
                            }
                        })()}
                    </th>
                </tr>
            </thead>
            <tbody>
                {shares.map((share, index) => {
                    return (
                        <tr key={index} className="d-flex">
                            <td className="col-6">
                                <Link
                                    to={makeSearchLink({
                                        field:
                                            share.reason_type === "added"
                                                ? "uploader"
                                                : "shared",
                                        value: share.group_name,
                                        pathname: `${remotePath}/search`,
                                    })}
                                >
                                    {share.group_name}
                                </Link>
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

function SharingStatusIcon({ shares }) {
    if (!shares) return [];

    // Icon showing the sharing status of the object
    const lockIcon = shares.some((share) => share.group_name === "public")
        ? faLockOpen
        : faLock;

    const lockTooltip = shares.some((share) => share.group_name === "public")
        ? "Object is shared with public"
        : "Object is not shared with public";

    return (
        <span data-toggle="tooltip" title={lockTooltip}>
            <FontAwesomeIcon
                icon={lockIcon}
                pull="left"
                size="1x"
                style={{ color: "grey", cursor: "pointer" }}
            />
        </span>
    );
}

function SharesList({ shares, groups, handleShare, currentFile, direct }) {
    function filterShares() {
        const ret = [];
        if (direct) {
            shares.forEach((share) => {
                if (share.related_object_dhash === currentFile) {
                    ret.push(share);
                }
            });
        } else {
            shares.forEach((share) => {
                if (share.related_object_dhash !== currentFile) {
                    ret.push(share);
                }
            });
        }
        return ret;
    }

    if (!shares || !groups) {
        return <div className="card-body text-muted">Loading data...</div>;
    }

    const filteredShares = filterShares(shares);
    if (filteredShares.length) {
        const groupedItems = groupShares(filteredShares);
        return (
            <div>
                {groupedItems.map((sharesGroup, index) => (
                    <ShareGroupItem
                        key={index}
                        {...sharesGroup}
                        showDhash={!direct}
                    />
                ))}
                {handleShare && (
                    <ShareForm onSubmit={handleShare} groups={groups} />
                )}
            </div>
        );
    } else {
        return <div className="card-body text-muted">No shares to display</div>;
    }
}

function SharesBox() {
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

export default SharesBox;
