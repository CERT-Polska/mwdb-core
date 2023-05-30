import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { isEmpty } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { AttributePermissionsGroupInput } from "../common/AttributePermissionsGroupInput";
import { AttributePermissionsList } from "../common/AttributePermissionsList";
import { AttributeOutletContext } from "@mwdb-web/types/context";
import { Group, Permission } from "@mwdb-web/types/types";

type ModalSpec = {
    action?: () => void;
    message?: string;
    buttonStyle?: string;
    confirmText?: string;
};

export function AttributesPermissionsView() {
    const { attributeKey } = useParams();
    const { attribute }: AttributeOutletContext = useOutletContext();
    const { setAlert } = useViewAlert();
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission>>(
        {} as Record<string, Permission>
    );
    const [modalSpec, setModalSpec] = useState<ModalSpec>({});
    const [groupName, setGroupName] = useState<string>("");

    const updateAttributePermissions = useCallback(async () => {
        const response = await api.getAttributePermissions(attributeKey);
        const attributePermissions = response.data.attribute_permissions.reduce(
            (prev, next) => {
                return {
                    ...prev,
                    [next.group_name]: {
                        read: next.can_read,
                        set: next.can_set,
                    },
                };
            },
            {}
        );
        setPermissions(attributePermissions);
    }, [attributeKey]);

    useEffect(() => {
        updateAllGroups();
        updateAttributePermissions();
    }, []);

    async function addGroup(group: string) {
        try {
            await api.setAttributePermission(
                attribute.key,
                group,
                false,
                false
            );
            await updateAttributePermissions();
            setGroupName("");
        } catch (error) {
            setAlert({ error });
        }
    }

    async function updateGroup(group: string, permission: Permission) {
        const { read, set } = permission;
        try {
            await api.setAttributePermission(attribute.key, group, read, set);
            await updateAttributePermissions();
            setModalSpec({});
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleUpdateGroup(group: string, permission: Permission) {
        setModalSpec({
            action: () => updateGroup(group, permission),
            message: `Update ${group} group permissions`,
            buttonStyle: "btn-primary",
            confirmText: "Update",
        });
    }

    async function removeGroup(group: string) {
        try {
            await api.removeAttributePermission(attribute.key, group);
            await updateAttributePermissions();
            setModalSpec({});
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleRemoveGroup(group: string) {
        setModalSpec({
            action: () => removeGroup(group),
            message: `Remove ${group} group permissions`,
            buttonStyle: "btn-danger",
            confirmText: "Remove",
        });
    }

    async function updateAllGroups() {
        try {
            const response = await api.getGroups();
            setAllGroups(response.data.groups);
        } catch (error) {
            setAlert({ error });
        }
    }

    if (isEmpty(attribute)) return <></>;

    return (
        <>
            <AttributePermissionsGroupInput
                permissions={permissions}
                groups={allGroups}
                addGroup={addGroup}
                groupName={groupName}
                setGroupName={setGroupName}
            />
            <AttributePermissionsList
                permissions={permissions}
                updateGroup={handleUpdateGroup}
                removeGroup={handleRemoveGroup}
            />
            <ConfirmationModal
                isOpen={!isEmpty(modalSpec)}
                onRequestClose={() => setModalSpec({})}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                buttonStyle={modalSpec.buttonStyle}
                confirmText={modalSpec.confirmText}
            />
        </>
    );
}
