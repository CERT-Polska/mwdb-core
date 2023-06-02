import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { SizeProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
    text: string;
    size?: SizeProp;
    tooltipMessage?: string;
};

export const ActionCopyToClipboard = (props: Props) => {
    const { text, tooltipMessage = "", size = "sm" } = props;
    return (
        <span style={{ cursor: "pointer" }}>
            <CopyToClipboard text={text}>
                <span data-toggle="tooltip" title={tooltipMessage}>
                    <i>
                        <FontAwesomeIcon icon={faCopy} size={size} />
                    </i>
                </span>
            </CopyToClipboard>
        </span>
    );
};
