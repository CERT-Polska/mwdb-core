import React, { Component } from "react";

import { capabilitiesList } from "@mwdb-web/commons/auth";

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
