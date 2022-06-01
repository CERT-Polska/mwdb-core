import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

const ActionCopyToClipboard = (props) => {
    const { text, tooltipMessage, size } = props;
    return (
        <CopyToClipboard text={text} style={{ cursor: "pointer" }}>
            <span data-toggle="tooltip" title={tooltipMessage}>
                <i>
                    <FontAwesomeIcon icon={faCopy} size={size} />
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
