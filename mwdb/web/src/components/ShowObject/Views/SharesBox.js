import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import Autocomplete from "react-autocomplete";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import { RefString, DateString, ConfirmationModal } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useRemote } from "@mwdb-web/commons/remotes";

function ShareItem(props) {
    const context = useContext(ObjectContext);
    const remote = useRemote();
    const remotePath = remote ? `remote/${remote}/` : "";
    let fieldStyle = {
        wordBreak: "break-all",
    };
    const isCurrentObject = props.related_object_dhash === context.object.id;
    const isUploader = props.related_user_login === props.group_name;

    if (!isCurrentObject) fieldStyle.backgroundColor = "lightgray";

    return (
        <tr style={fieldStyle}>
            <td>
                <Link
                    to={makeSearchLink(
                        "uploader",
                        props.group_name,
                        false,
                        `${remotePath}search`
                    )}
                >
                    {props.group_name}
                </Link>
                {isCurrentObject && isUploader && (
                    <span className="ml-2">(uploader)</span>
                )}
            </td>
            <td>
                <RefString
                    reason_type={props.reason_type}
                    related_object_dhash={props.related_object_dhash}
                    related_object_type={props.related_object_type}
                    related_user_login={props.related_user_login}
                />
            </td>
            <td>
                <DateString date={props.access_time} />
            </td>
        </tr>
    );
}

function ShareForm(props) {
    const [group, setGroup] = useState("");

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
                inputProps={{ id: "states-autocomplete" }}
                getItemValue={(item) => item}
                shouldItemRender={(item, value) => {
                    return (
                        item.toLowerCase().indexOf(value.toLowerCase()) !== -1
                    );
                }}
                items={props.groups}
                onChange={(event) => setGroup(event.target.value)}
                onSelect={(value) => setGroup(value)}
                renderInput={(props) => (
                    <div className="input-group">
                        <input
                            {...props}
                            className="form-control"
                            placeholder="Share with group"
                        />
                        <div className="input-group-append">
                            <input
                                className="btn btn-outline-primary"
                                type="submit"
                                value="Add"
                            />
                        </div>
                    </div>
                )}
                wrapperStyle={{ display: "block" }}
                renderMenu={(children) => (
                    <div
                        className={
                            "dropdown-menu " +
                            (children.length !== 0 ? "show" : "")
                        }
                    >
                        {children.map((c) => (
                            <a
                                key={c}
                                href="#dropdown"
                                className="dropdown-item"
                                style={{ cursor: "pointer" }}
                            >
                                {c}
                            </a>
                        ))}
                    </div>
                )}
                renderItem={(item, isHighlighted) => (
                    <div
                        className={`item ${
                            isHighlighted ? "item-highlighted" : ""
                        }`}
                        key={item}
                    >
                        {item}
                    </div>
                )}
            />
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

    async function updateShares() {
        try {
            let response = await api.getObjectShares(context.object.id);
            setGroups(response.data.groups);
            setItems(response.data.shares);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function doShare(group) {
        try {
            setIsModalOpen(false);
            await api.shareObjectWith(context.object.id, group);
            updateShares();
        } catch (error) {
            context.setObjectError(error);
        }
    }

    function handleShare(group) {
        setIsModalOpen(true);
        setShareReceiver(group);
    }

    const getShares = useCallback(updateShares, [context.object.id]);

    useEffect(() => {
        getShares();
    }, [getShares]);

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
                </div>
            </div>
            <table className="table table-striped table-bordered wrap-table">
                <thead>
                    <tr>
                        <th key="group">Group name</th>
                        <th key="reason">Reason</th>
                        <th key="timestamp">Access time</th>
                    </tr>
                </thead>
                <tbody>
                    {items
                        .sort((a, b) => {
                            if (
                                a.related_object_dhash !==
                                b.related_object_dhash
                            ) {
                                // Current object should be on top
                                if (
                                    b.related_object_dhash === context.object.id
                                )
                                    return 1;
                                if (
                                    a.related_object_dhash === context.object.id
                                )
                                    return -1;
                                // Inherited entries order by dhash
                                if (
                                    a.related_object_dhash >
                                    b.related_object_dhash
                                )
                                    return 1;
                                if (
                                    a.related_object_dhash <
                                    b.related_object_dhash
                                )
                                    return -1;
                            }
                            const a_time = Date.parse(a.access_time);
                            const b_time = Date.parse(b.access_time);
                            // The same dhash order by time
                            if (a_time > b_time) return 1;
                            if (a_time < b_time) return -1;
                            return 0;
                        })
                        .map((item, idx) => (
                            <ShareItem key={idx} {...item} />
                        ))}
                </tbody>
            </table>
            {!api.remote ? (
                <ShareForm onSubmit={handleShare} groups={groups} />
            ) : (
                []
            )}
        </div>
    );
}

export default SharesBox;
