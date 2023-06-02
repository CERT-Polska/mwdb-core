import { useState, useRef } from "react";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

type Props = {
    isOpen: boolean;
    onConfirm: (key: string) => void;
    onClose: () => void;
};

export function KeyNameModal({ isOpen, onConfirm, onClose }: Props) {
    const [currentKeyName, setCurrentKeyName] = useState<string>("");
    const ref = useRef<HTMLInputElement>(null);

    function handleClose() {
        onClose();
        setCurrentKeyName("");
    }

    function handleConfirm() {
        onConfirm(currentKeyName);
        setCurrentKeyName("");
    }

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            buttonStyle="btn-primary"
            onConfirm={handleConfirm}
            onAfterOpen={() => ref.current?.focus()}
            message={`Name the API key`}
            confirmText="Create"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirm();
                }}
            >
                <input
                    ref={ref}
                    className="form-control"
                    type="text"
                    placeholder="API key name..."
                    onChange={(e) => setCurrentKeyName(e.target.value)}
                    value={currentKeyName}
                />
            </form>
        </ConfirmationModal>
    );
}
