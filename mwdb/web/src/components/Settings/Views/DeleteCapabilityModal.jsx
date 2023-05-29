import { isEmpty } from "lodash";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";

function DeleteCapabilityModal(props) {
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

export default DeleteCapabilityModal;
