import React, { useState, useEffect } from "react";
import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { CapabilitiesHeader } from "../common/CapabilitiesHeader";
import { CapabilitiesList } from "../common/CapabilitiesList";
import { CapabilityChangeCard } from "../common/CapabilityChangeCard";
import { Capability, Group } from "@mwdb-web/types/types";

type ChangeCapabilitiesValues = {
    groupName: string;
    capabilities: Capability[];
};

export function AccessControlView() {
    const { setAlert } = useViewAlert();
    const [groups, setGroups] = useState<Group[]>([]);
    const [isChangeModalOpen, setChangeModalOpen] = useState<boolean>(false);
    const [disabledModalButton, setDisabledModalButton] =
        useState<boolean>(false);
    const [changeToApply, setChangeToApply] =
        useState<ChangeCapabilitiesValues>({} as ChangeCapabilitiesValues);

    async function getGroups() {
        try {
            const response = await api.getGroups();
            const groupList = response.data.groups.sort((a, b) => {
                const aIsPublic = a["name"] === "public" ? 1 : 0;
                const bIsPublic = b["name"] === "public" ? 1 : 0;
                const aIsPrivate = a["private"] ? 1 : 0;
                const bIsPrivate = b["private"] ? 1 : 0;

                return (
                    bIsPublic - aIsPublic ||
                    aIsPrivate - bIsPrivate ||
                    a["name"].localeCompare(b["name"])
                );
            });
            setGroups(groupList);
        } catch (error) {
            setAlert({ error });
        }
    }

    async function changeCapabilities({
        groupName,
        capabilities,
    }: ChangeCapabilitiesValues) {
        try {
            setDisabledModalButton(true);
            await api.updateGroup(groupName, { capabilities });
            await getGroups();
            setAlert({
                success: `Group '${groupName}' capabilities successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        } finally {
            setDisabledModalButton(false);
            setChangeModalOpen(false);
        }
    }

    useEffect(() => {
        getGroups();
    }, []);

    return (
        <div className="container">
            <h2>Access control</h2>
            <p className="lead">
                Use a form below to enable/disable capabilities for specific
                user or group.
            </p>
            <CapabilityChangeCard
                groups={groups}
                onSubmit={(groupName, capabilities) => {
                    setChangeToApply({ groupName, capabilities });
                    setChangeModalOpen(true);
                }}
            />
            <table className="table table-bordered wrap-table">
                <tbody>
                    {groups
                        .filter((group) => group.capabilities.length > 0)
                        .map((group) => (
                            <React.Fragment key={group.name}>
                                <CapabilitiesHeader group={group} />
                                <CapabilitiesList
                                    capabilities={group.capabilities}
                                    onDelete={(capToRemove) => {
                                        setChangeToApply({
                                            groupName: group.name,
                                            capabilities:
                                                group.capabilities.filter(
                                                    (cap) => cap !== capToRemove
                                                ),
                                        });
                                        setChangeModalOpen(true);
                                    }}
                                />
                            </React.Fragment>
                        ))}
                </tbody>
            </table>
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message={`Are you sure you want to change '${changeToApply.groupName}' capabilities?`}
                isOpen={isChangeModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setChangeModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    changeCapabilities(changeToApply);
                }}
            />
        </div>
    );
}
