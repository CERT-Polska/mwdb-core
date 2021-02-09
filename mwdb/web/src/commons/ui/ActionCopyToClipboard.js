import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CopyToClipboard } from "react-copy-to-clipboard";

const ActionCopyToClipboard = (props) => {
    const { text, tooltipMessage, size } = props;
    return (
        <CopyToClipboard text={text} style={{ cursor: "pointer" }}>
            <span data-toggle="tooltip" title={tooltipMessage}>
                <i>
                    <FontAwesomeIcon icon="copy" size={size} />
                </i>
            </span>
        </CopyToClipboard>
    );
};

ActionCopyToClipboard.defaultProps = {
    size: "sm",
    tooltipMessage: "",
};

export default ActionCopyToClipboard;
