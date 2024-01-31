import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@mwdb-web/commons/auth";
import { api } from "@mwdb-web/commons/api";
import { toast } from "react-toastify";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { FieldPath, FieldValues, PathValue } from "react-hook-form";

export function useGroup<T extends FieldValues>(
    setValue: (fieldName: PathValue<T, FieldPath<T>>, value: string) => void,
    fieldName: PathValue<T, FieldPath<T>>
) {
    const auth = useContext(AuthContext);
    const [groups, setGroups] = useState<string[]>([]);

    useEffect(() => {
        getGroups();
    }, [auth?.user?.login]);

    async function getGroups() {
        try {
            let response = await api.getShareInfo();
            let groups = response.data.groups;
            groups.splice(groups.indexOf("public"), 1);
            groups.splice(groups.indexOf(auth.user.login), 1);

            setGroups(groups);
            setValue(fieldName, groups.length > 0 ? "default" : "private");
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }
    return {
        groups,
        setGroups,
    };
}
