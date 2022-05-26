import React, { Component } from "react";
import { Link } from "react-router-dom-v5-compat";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { makeSearchLink } from "@mwdb-web/commons/helpers";

export function getStyleForTag(tag) {
    let styleList = {
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
        ],
    };

    for (let style of Object.keys(styleList)) {
        if (
            styleList[style].filter((t) =>
                t.endsWith(":") ? tag.startsWith(t) : tag === t
            ).length > 0
        )
            return style;
    }
    if (tag.indexOf(":") !== -1) return "info";
    return "danger";
}

export class Tag extends Component {
    static defaultProps = {
        searchable: true,
    };
    render() {
        let badgeStyle = getStyleForTag(this.props.tag);
        return (
            <div className="tag">
                <span
                    className={"d-flex badge badge-" + badgeStyle}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                >
                    {this.props.searchable ? (
                        <Link
                            to={makeSearchLink({
                                field: "tag",
                                value: this.props.tag,
                                pathname: this.props.searchEndpoint,
                            })}
                            className="tag-link"
                            onClick={(ev) =>
                                this.props.tagClick &&
                                this.props.tagClick(ev, this.props.tag)
                            }
                        >
                            {this.props.tag}
                        </Link>
                    ) : (
                        <span>{this.props.tag}</span>
                    )}
                    {(this.props.deletable || this.props.filterable) && (
                        <a
                            className="tag-link"
                            href="#tag"
                            onClick={(ev) =>
                                this.props.tagRemove(ev, this.props.tag)
                            }
                        >
                            <FontAwesomeIcon
                                icon={this.props.filterable ? "ban" : "times"}
                                pull="right"
                                size="1x"
                            />
                        </a>
                    )}
                </span>
            </div>
        );
    }
}

export class TagList extends Component {
    render() {
        return (
            <React.Fragment>
                {this.props.tags
                    .sort((a, b) => (a.tag > b.tag ? 1 : -1))
                    .map((c) => (
                        <Tag tag={c.tag} key={c.tag} {...this.props} />
                    ))}
            </React.Fragment>
        );
    }
}
