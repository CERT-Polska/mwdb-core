import readableTime from "readable-timestamp";

import { flatMap } from "lodash";

import { Identicon } from "@mwdb-web/commons/ui";
import { Comment } from "@mwdb-web/types/types";

type Props = Comment & {
    removeComment?: (id: number) => void;
};

export function CommentItem(props: Props) {
    return (
        <li className="media" style={{ overflowWrap: "anywhere" }}>
            <div className="mr-3">
                <Identicon data={props.author} size="45" />
            </div>
            <div className="media-body">
                <h4 className="media-heading user_name">
                    {props.author ? props.author : "(deleted)"}
                </h4>
                <span>
                    {flatMap(
                        props.comment.split("\n"),
                        (value, index: number, array) =>
                            array.length - 1 !== index ? [value, <br />] : value
                    )}
                </span>
                <p>
                    {props.removeComment && (
                        <button
                            className="btn btn-link p-0 remove-comment-link"
                            onClick={() => props.removeComment!(props.id)}
                        >
                            Remove
                        </button>
                    )}
                </p>
            </div>
            <p className="float-right">
                <small>{readableTime(new Date(props.timestamp))}</small>
            </p>
        </li>
    );
}
