import React from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faTimes } from "@fortawesome/free-solid-svg-icons";

import { makeSearchLink } from "../helpers";
import { Tag as TagType } from "@mwdb-web/types/types";

type StyleList = {
    primary: string[];
    warning: string[];
    success: string[];
    secondary: string[];
};

export function getStyleForTag(tag: string) {
    const styleList: StyleList = {
        primary: ["spam", "src:", "uploader:", "feed:"],
        warning: ["ripped:", "contains:", "matches:", "maybe:"],
        success: ["static:", "dynamic:"],
        secondary: [
            "runnable:",
            "archive:",
            "dump:",
            "script:",
            "document:",
            "archive",
            "dump",
            "misc:",
        ],
    };

    for (let style of Object.keys(styleList)) {
        if (
            styleList[style as keyof StyleList].filter((t: string) =>
                t.endsWith(":") ? tag.startsWith(t) : tag === t
            ).length > 0
        )
            return style;
    }

    if (tag.indexOf(":") !== -1) return "info";
    return "danger";
}

type TagProps = {
    tag: string;
    searchEndpoint?: string;
    tagClick?: (ev: React.MouseEvent, tag: string) => void;
    tagRemove?: (ev: React.MouseEvent, tag: string) => void;
    searchable?: boolean;
    deletable?: boolean;
    filterable?: boolean;
};

export function Tag({
    tag,
    searchEndpoint,
    tagClick,
    tagRemove,
    searchable = true,
    deletable,
    filterable,
}: TagProps) {
    const badgeStyle = getStyleForTag(tag);
    return (
        <div className="tag">
            <span className={`d-flex badge badge-${badgeStyle}`}>
                {searchable ? (
                    <Link
                        to={makeSearchLink({
                            field: "tag",
                            value: tag,
                            pathname: searchEndpoint,
                        })}
                        className="tag-link"
                        onClick={(ev) => tagClick && tagClick(ev, tag)}
                    >
                        {tag}
                    </Link>
                ) : (
                    <span>{tag}</span>
                )}
                {(deletable || filterable) && (
                    <span
                        className="tag-link"
                        role="button"
                        onClick={(ev) => tagRemove && tagRemove(ev, tag)}
                    >
                        <FontAwesomeIcon
                            icon={filterable ? faBan : faTimes}
                            pull="right"
                            size="1x"
                        />
                    </span>
                )}
            </span>
        </div>
    );
}

type TagListProps = TagProps & {
    tags: TagType[];
};

export function TagList({ tags, ...props }: TagListProps) {
    return tags
        .sort((a: TagType, b: TagType) => a.tag.localeCompare(b.tag))
        .map((tag: TagType) => <Tag {...props} tag={tag.tag} key={tag.tag} />);
}
