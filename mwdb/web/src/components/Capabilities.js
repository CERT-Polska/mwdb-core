import React, { Component } from "react";
import { fromPlugin } from "@mwdb-web/commons/extensions";

export let capabilitiesList = {
    manage_users: "Managing users and groups (system administration)",
    share_queried_objects: "Query for all objects in system",
    access_all_objects: "Has access to all new uploaded objects into system",
    sharing_objects: "Can share objects with all groups in system",
    adding_tags: "Can add tags",
    removing_tags: "Can remove tags",
    adding_comments: "Can add comments",
    removing_comments: "Can remove (all) comments",
    adding_parents: "Can specify parent of uploaded object",
    reading_all_attributes:
        "Has access to all attributes of object (including hidden)",
    adding_all_attributes: "Can add all attributes to object",
    managing_attributes: "Can define new attributes and manage them",
    removing_attributes: "Can remove attribute from objects",
    adding_configs: "Can upload configs",
    adding_blobs: "Can upload text blobs",
    unlimited_requests: "API requests are not rate-limited for this group",
    removing_objects: "Can remove objects",
};

for (let extraCapabilities of fromPlugin("capabilities")) {
    capabilitiesList = { ...capabilitiesList, ...extraCapabilities };
}

export default class Capabilities extends Component {
    isCapabilityChanged(cap) {
        return (
            this.props.originalCapabilities.includes(cap) !==
            this.props.capabilities.includes(cap)
        );
    }

    capabilityInheritedFrom(cap) {
        return this.props.groups
            .filter((x) => x.capabilities.includes(cap))
            .map((x) => x.name);
    }

    handleCapabilitySet = (ev) => {
        let cap = ev.target.id;
        if (this.props.capabilities.includes(cap)) {
            this.props.onSetState({
                capabilities: this.props.capabilities.filter((x) => x !== cap),
            });
        } else {
            this.props.onSetState({
                capabilities: this.props.capabilities.concat(cap),
            });
        }
    };

    render() {
        let changeNotifier = (cap) => {
            return this.isCapabilityChanged(cap) ? (
                <span style={{ color: "red" }}>*</span>
            ) : (
                <span />
            );
        };

        return (
            <div>
                <h4>Capabilities</h4>
                <div className="form-group">
                    {Object.keys(capabilitiesList).map((cap) => (
                        <div>
                            <div className="row" key={cap}>
                                <div className="col-10">
                                    <p>
                                        {changeNotifier(cap)}
                                        {capabilitiesList[cap]}
                                    </p>
                                </div>
                                <div className="col-2">
                                    <div className="md-form">
                                        <div className="material-switch">
                                            <input
                                                type="checkbox"
                                                name="switch-primary"
                                                value=""
                                                onChange={
                                                    this.handleCapabilitySet
                                                }
                                                id={cap}
                                                checked={this.props.capabilities.includes(
                                                    cap
                                                )}
                                            />
                                            <label
                                                htmlFor={cap}
                                                className="bg-success"
                                            ></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
