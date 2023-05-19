import { isEmpty } from "lodash";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Capabality } from "@mwdb-web/types/types";

type Props = {
    capabilitiesToDelete: Capabality | "";
    changeCapabilities: (
        capability: Capabality | "",
        callback: () => void
    ) => Promise<void>;
    setCapabilitiesToDelete: (cap: Capabality | "") => void;
    successMessage: string;
};

export function DeleteCapabilityModal(props: Props) {
    const {
        changeCapabilities,
        capabilitiesToDelete,
        setCapabilitiesToDelete,
        successMessage,
    } = props;

    const { setAlert } = useViewAlert();

    return (
        <ConfirmationModal
            buttonStyle="badge-success"
            confirmText="Yes"
            message={`Are you sure you want to delete '${capabilitiesToDelete}' capabilities?`}
            isOpen={!isEmpty(capabilitiesToDelete)}
            onRequestClose={() => setCapabilitiesToDelete("")}
            onConfirm={(ev) => {
                ev.preventDefault();
                changeCapabilities(capabilitiesToDelete, () => {
                    setCapabilitiesToDelete("");
                    setAlert({
                        success: successMessage,
                    });
                });
            }}
        />
    );
}
