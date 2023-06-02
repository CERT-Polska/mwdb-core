import Modal from "react-modal";

Modal.setAppElement("#root");

type Props = ReactModal.Props & {
    message?: string;
    onCancel?: React.MouseEventHandler;
    cancelText?: string;
    disabled?: boolean;
    buttonStyle?: string;
    onConfirm?: React.MouseEventHandler;
    confirmDisabled?: boolean;
    confirmText?: string;
};

export function ConfirmationModal(props: Props) {
    const modalStyle = {
        content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
        },
    };

    return (
        <Modal
            {...props}
            isOpen={props.isOpen}
            onRequestClose={props.onRequestClose}
            onAfterOpen={props.onAfterOpen}
            style={modalStyle}
        >
            <div className="modal-header">
                <h5 className="modal-title">{props.message}</h5>
                <button
                    type="button"
                    className="close"
                    data-dismiss="modal"
                    aria-label="Close"
                    onClick={props.onRequestClose}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            {props.children ? (
                <div className="modal-body">{props.children}</div>
            ) : (
                []
            )}
            <div className="modal-footer">
                <button
                    type="button"
                    className="btn btn-secondary"
                    data-dismiss="modal"
                    onClick={props.onCancel || props.onRequestClose}
                    disabled={props.disabled}
                >
                    {props.cancelText || "Close"}
                </button>
                <button
                    type="button"
                    className={`btn ${props.buttonStyle || "btn-danger"}`}
                    data-dismiss="modal"
                    onClick={props.onConfirm}
                    disabled={props.disabled || props.confirmDisabled}
                >
                    {props.confirmText || "Yes"}
                </button>
            </div>
        </Modal>
    );
}
