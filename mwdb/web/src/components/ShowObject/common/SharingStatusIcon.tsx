import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLockOpen, faLock } from "@fortawesome/free-solid-svg-icons";
import { Share } from "@mwdb-web/types/types";

type Props = {
    shares?: Share[];
};

export function SharingStatusIcon({ shares }: Props) {
    if (!shares) return <></>;

    // Icon showing the sharing status of the object
    const lockIcon = shares.some((share) => share.group_name === "public")
        ? faLockOpen
        : faLock;

    const lockTooltip = shares.some((share) => share.group_name === "public")
        ? "Object is shared with public"
        : "Object is not shared with public";

    return (
        <span data-toggle="tooltip" title={lockTooltip}>
            <FontAwesomeIcon
                icon={lockIcon}
                pull="left"
                size="1x"
                style={{ color: "grey", cursor: "pointer" }}
            />
        </span>
    );
}
