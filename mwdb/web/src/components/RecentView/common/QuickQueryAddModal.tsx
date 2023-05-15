import { useEffect, useState } from "react";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { Query } from "@mwdb-web/types/types";

type Props = {
    isOpen: boolean;
    onSubmit: (query: string) => void;
    onRequestModalClose: (query: string) => void;
    queries: Query[];
    onError: (error: string) => void;
    error?: string;
};

export function QuickQueryAddModal(props: Props) {
    const { isOpen, onSubmit, onRequestModalClose, error, onError, queries } =
        props;
    const [value, setValue] = useState<string>("");

    useEffect(() => {
        if (!isOpen) {
            setValue("");
        }
    }, [isOpen]);

    const handleSubmit = (ev?: React.FormEvent<HTMLFormElement>) => {
        if (!value) {
            onError("Please set name for your quick query.");
            return;
        }
        const names = queries.map((x: Query) => x.name);
        if (names.includes(value)) {
            onError("This query name already exists");
            return;
        }
        ev && ev.preventDefault();
        onSubmit(value);
    };

    const handleClose = (ev: React.MouseEvent | React.KeyboardEvent) => {
        ev.preventDefault();
        onRequestModalClose(value);
    };

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add new custom quick query"
            isOpen={isOpen}
            onRequestClose={handleClose}
            onConfirm={() => handleSubmit()}
        >
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={`form-control ${
                        error ? "is-invalid" : ""
                    }`.trim()}
                    style={{ width: "470px" }}
                    placeholder="Set name for your quick query"
                    value={value}
                    onChange={(ev) => setValue(ev.target.value)}
                    name="name"
                    required
                />
                {error && <p className="invalid-feedback">{error}</p>}
            </form>
        </ConfirmationModal>
    );
}
