import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

type Props = {
    name: string;
    value: boolean;
    children: React.ReactNode;
    disabled?: boolean;
    onUpdate: (value: Record<string, boolean | string>) => Promise<void>;
};

export function FeatureSwitch(props: Props) {
    const { name, value, disabled = false, onUpdate, children } = props;
    const [isModalOpen, setModalOpen] = useState(false);
    const button = value ? (
        <button
            className="btn btn-outline-danger"
            disabled={disabled}
            onClick={() => setModalOpen(true)}
        >
            Disable
        </button>
    ) : (
        <button
            className="btn btn-outline-success"
            disabled={disabled}
            onClick={() => setModalOpen(true)}
        >
            Enable
        </button>
    );
    const message = `Are you sure you want to ${
        value ? "disable" : "enable"
    } '${name}' setting?`;

    return (
        <div className="d-flex ml-2 mr-2">
            <div className="flex-grow-1 p-2">{children}</div>
            <div className="align-self-center p-2">{button}</div>
            <ConfirmationModal
                isOpen={isModalOpen}
                disabled={disabled}
                onRequestClose={() => setModalOpen(false)}
                onConfirm={() => {
                    setModalOpen(false);
                    onUpdate({ [name]: !value });
                }}
                message={message}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
