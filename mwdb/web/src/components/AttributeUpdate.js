import React, { Component } from "react";
import Autocomplete from "react-autocomplete";

import _ from "lodash";

import api from "@mwdb-web/commons/api";
import { ConfirmationModal, ObjectLink, View } from "@mwdb-web/commons/ui";

class AttributePermissionsBox extends Component {
    state = {
        changedPermissions: {},
        newMember: "",
    };

    isPermissionChanged(groupName, permission) {
        let permset = this.state.changedPermissions[groupName];
        return (
            permset &&
            permset[permission] !==
                this.props.permissions[groupName][permission]
        );
    }

    getPermission(groupName, permission) {
        let permset =
            this.state.changedPermissions[groupName] ||
            this.props.permissions[groupName];
        return permset[permission];
    }

    switchPermission(groupName, permission) {
        let changedPermissions = { ...this.state.changedPermissions };
        if (!changedPermissions[groupName])
            changedPermissions[groupName] = {
                read: this.props.permissions[groupName].read,
                set: this.props.permissions[groupName].set,
            };
        changedPermissions[groupName][permission] = !changedPermissions[
            groupName
        ][permission];
        this.setState({ changedPermissions });
    }

    render() {
        return (
            <div>
                <table className="table table-striped table-bordered wrap-table">
                    <thead>
                        <tr>
                            <th>Group name</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(this.props.permissions)
                            .sort()
                            .map((permGroup) => (
                                <tr key={permGroup}>
                                    <td>
                                        <ObjectLink
                                            id={permGroup}
                                            type="group"
                                        />
                                    </td>
                                    <td>
                                        <table className="float-left">
                                            <tr>
                                                <td>
                                                    <div className="material-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id={`${permGroup}-readSwitch`}
                                                            onChange={(ev) => {
                                                                this.switchPermission(
                                                                    permGroup,
                                                                    "read"
                                                                );
                                                            }}
                                                            checked={this.getPermission(
                                                                permGroup,
                                                                "read"
                                                            )}
                                                        />
                                                        <label
                                                            className="bg-primary"
                                                            htmlFor={`${permGroup}-readSwitch`}
                                                        />
                                                    </div>
                                                    <div>
                                                        {this.isPermissionChanged(
                                                            permGroup,
                                                            "read"
                                                        ) ? (
                                                            <span
                                                                style={{
                                                                    color:
                                                                        "red",
                                                                }}
                                                            >
                                                                *
                                                            </span>
                                                        ) : (
                                                            []
                                                        )}
                                                        Can read
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="material-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id={`${permGroup}-setSwitch`}
                                                            onChange={(ev) => {
                                                                this.switchPermission(
                                                                    permGroup,
                                                                    "set"
                                                                );
                                                            }}
                                                            checked={this.getPermission(
                                                                permGroup,
                                                                "set"
                                                            )}
                                                        />
                                                        <label
                                                            className="bg-primary"
                                                            htmlFor={`${permGroup}-setSwitch`}
                                                        />
                                                    </div>
                                                    <div>
                                                        {this.isPermissionChanged(
                                                            permGroup,
                                                            "set"
                                                        ) ? (
                                                            <span
                                                                style={{
                                                                    color:
                                                                        "red",
                                                                }}
                                                            >
                                                                *
                                                            </span>
                                                        ) : (
                                                            []
                                                        )}
                                                        Can set
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={
                                                !this.isPermissionChanged(
                                                    permGroup,
                                                    "read"
                                                ) &&
                                                !this.isPermissionChanged(
                                                    permGroup,
                                                    "set"
                                                )
                                            }
                                            onClick={() =>
                                                this.props.updateGroup(
                                                    permGroup,
                                                    this.getPermission(
                                                        permGroup,
                                                        "read"
                                                    ),
                                                    this.getPermission(
                                                        permGroup,
                                                        "set"
                                                    )
                                                )
                                            }
                                        >
                                            Update
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() =>
                                                this.props.removeGroup(
                                                    permGroup
                                                )
                                            }
                                        >
                                            Remove group
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        <tr>
                            <td colSpan="2">
                                <Autocomplete
                                    value={this.state.newMember}
                                    inputProps={{ id: "states-autocomplete" }}
                                    wrapperStyle={{
                                        position: "relative",
                                        display: "inline-block",
                                    }}
                                    items={this.props.groupItems}
                                    getItemValue={(item) => item.name}
                                    shouldItemRender={(item, value) => {
                                        return (
                                            item.name
                                                .toLowerCase()
                                                .indexOf(
                                                    value.toLowerCase()
                                                ) !== -1
                                        );
                                    }}
                                    onChange={(event) =>
                                        this.setState({
                                            newMember: event.target.value,
                                        })
                                    }
                                    onSelect={(value) =>
                                        this.setState({ newMember: value })
                                    }
                                    renderInput={(props) => (
                                        <input
                                            {...props}
                                            className="form-control"
                                        />
                                    )}
                                    renderMenu={(children) => (
                                        <div
                                            className={
                                                "dropdown-menu " +
                                                (children.length !== 0
                                                    ? "show"
                                                    : "")
                                            }
                                        >
                                            {children.map((c, idx) => (
                                                <a
                                                    key={idx}
                                                    href="#dropdown"
                                                    className="dropdown-item"
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {c}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    renderItem={(item, isHighlighted) => (
                                        <div
                                            className={`item ${
                                                isHighlighted
                                                    ? "item-highlighted"
                                                    : ""
                                            }`}
                                            key={item.name}
                                        >
                                            {item.name}
                                        </div>
                                    )}
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() =>
                                        this.state.newMember &&
                                        this.props.addGroup(
                                            this.state.newMember
                                        )
                                    }
                                    disabled={!this.state.newMember}
                                >
                                    Add group
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

class AttributeUpdate extends Component {
    state = {
        label: "",
        description: "",
        template: "",
        hidden: false,
        permissions: {},
        groups: [],
        modalSpec: {},
        isModalOpen: false,
        error: null,
        success: false,
    };

    addGroup = async (group) => {
        try {
            let metakey = this.props.match.params.metakey;
            await api.setMetakeyPermission(metakey, group, false, false);
            this.handleUpdate();
        } catch (error) {
            this.setState({ error });
        }
    };

    async updateGroup(group, can_read, can_set) {
        try {
            let metakey = this.props.match.params.metakey;
            await api.setMetakeyPermission(metakey, group, can_read, can_set);
            this.handleUpdate();
            this.setState({ isModalOpen: false });
        } catch (error) {
            this.setState({ error });
        }
    }

    handleUpdateGroup = (group, can_read, can_set) => {
        this.setState({
            isModalOpen: true,
            modalSpec: {
                action: this.updateGroup.bind(this, group, can_read, can_set),
                message: `Update ${group} group permissions`,
                buttonStyle: "bg-primary",
                confirmText: "Update",
            },
        });
    };

    async removeGroup(group) {
        try {
            let metakey = this.props.match.params.metakey;
            await api.deleteMetakeyPermission(metakey, group);
            this.handleUpdate();
            this.setState({ isModalOpen: false });
        } catch (error) {
            this.setState({ error });
        }
    }

    handleRemoveGroup = (group) => {
        this.setState({
            isModalOpen: true,
            modalSpec: {
                action: this.removeGroup.bind(this, group),
                message: `Remove ${group} group permissions`,
                buttonStyle: "bg-danger",
                confirmText: "Remove",
            },
        });
    };

    async handleUpdate() {
        let metakey = this.props.match.params.metakey;
        try {
            let response = await api.getMetakeyDefinition(metakey);
            let data = {
                label: response.data.label,
                description: response.data.description,
                template: response.data.template,
                hidden: response.data.hidden,
            };
            let permissions = {};
            for (let permission of response.data.permissions)
                permissions[permission["group_name"]] = {
                    read: permission["can_read"],
                    set: permission["can_set"],
                };
            response = await api.getGroups();
            this.setState({
                error: null,
                groups: response.data.groups,
                permissions,
                ..._.fromPairs(
                    _.toPairs(data).reduce(
                        (p, c) => p.concat([c], [["original_" + c[0], c[1]]]),
                        []
                    )
                ),
            });
        } catch (error) {
            this.setState({ error });
        }
    }

    changedFields() {
        let fields = ["label", "description", "template", "hidden"];
        let changed = fields.reduce(
            (p, c) =>
                p.concat(
                    this.state[c] !== this.state["original_" + c] ? c : []
                ),
            []
        );
        return changed;
    }

    componentDidMount() {
        this.handleUpdate();
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
        });
    };

    handleSubmit = async (event) => {
        event.preventDefault();
        let metakey = this.props.match.params.metakey;
        try {
            await api.addMetakeyDefinition(
                metakey,
                this.state.label,
                this.state.description,
                this.state.template,
                this.state.hidden
            );
            this.handleUpdate();
            this.setState({ success: true, error: null });
        } catch (error) {
            this.setState({ error });
        }
    };

    render() {
        let changeNotifier = (field) => {
            return this.state[field] !== this.state["original_" + field] ? (
                <span style={{ color: "red" }}>*</span>
            ) : (
                <span />
            );
        };

        let success = this.state.success && (
            <div>
                Attribute {this.props.match.params.metakey} modified
                successfully.
            </div>
        );

        return (
            <View
                ident="attributeUpdate"
                error={this.state.error}
                success={success}
            >
                <ConfirmationModal
                    isOpen={this.state.isModalOpen}
                    onRequestClose={() => this.setState({ isModalOpen: false })}
                    onConfirm={this.state.modalSpec.action}
                    message={this.state.modalSpec.message}
                    buttonStyle={this.state.modalSpec.buttonStyle}
                    confirmText={this.state.modalSpec.confirmText}
                />
                <h2>Modify attribute {this.props.match.params.metakey}</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Key</label>
                        <input
                            type="text"
                            className="form-control"
                            value={this.props.match.params.metakey}
                            disabled
                        />
                        <div class="form-hint">
                            Key must contain only lowercase letters and digits,
                            max 32 characters allowed.
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{changeNotifier("label")}Label</label>
                        <input
                            type="text"
                            name="label"
                            value={this.state.label}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            User-friendly name for attribute (optional)
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            {changeNotifier("description")}Description
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={this.state.description}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            Description of the attribute meaning (optional)
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{changeNotifier("template")}URL template</label>
                        <input
                            type="text"
                            name="template"
                            value={this.state.template}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            Provide URL template for specified attribute with
                            $value as placeholder (e.g.
                            http://system.cert.pl/job/$value)
                        </div>
                    </div>
                    <div className="form-group">
                        <label>
                            {changeNotifier("hidden")}Hidden attribute
                        </label>
                        <div className="material-switch">
                            <input
                                type="checkbox"
                                name="hidden"
                                onChange={this.handleInputChange}
                                id="hidden_checkbox"
                                checked={this.state.hidden}
                            />
                            <label
                                htmlFor="hidden_checkbox"
                                className="bg-primary"
                            ></label>
                        </div>
                        <div className="form-hint">
                            Hidden attributes have protected values. Attribute
                            values are not visible for users without
                            reading_all_attributes capability and explicit
                            request for reading them. Also only exact search is
                            allowed. User still must have permission to read key
                            to use it in query.
                        </div>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="btn btn-primary">
                            Submit
                        </button>
                    </div>
                </form>
                <AttributePermissionsBox
                    permissions={this.state.permissions}
                    groupItems={this.state.groups}
                    addGroup={this.addGroup}
                    updateGroup={this.handleUpdateGroup}
                    removeGroup={this.handleRemoveGroup}
                />
            </View>
        );
    }
}

export default AttributeUpdate;
