import React, { useState, useEffect } from "react";
import Pagination from "react-js-pagination";

import { CommentItem } from "./CommentItem";
import { Comment } from "@mwdb-web/types/types";

type Props = {
    comments: Comment[];
    removeComment: ((id: number) => void) | null;
};

export function CommentList({ comments, removeComment }: Props) {
    const itemsCountPerPage = 5;
    const [activePage, setActivePage] = useState(1);

    useEffect(() => {
        if (
            comments &&
            comments.length <= itemsCountPerPage * (activePage - 1)
        ) {
            // Come back to first page if activePage is too big
            setActivePage(1);
        }
    }, [activePage, comments]);

    if (!comments) {
        return <div className="card-body text-muted">Loading data...</div>;
    }

    if (comments.length === 0) {
        return (
            <div className="card-body text-muted">No comments to display</div>
        );
    }
    const commentNodes = comments
        .sort(
            (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
        )
        .slice(
            (activePage - 1) * itemsCountPerPage,
            itemsCountPerPage * activePage
        )
        .map((comment, index) => (
            <React.Fragment key={index}>
                <CommentItem
                    id={comment.id}
                    comment={comment.comment}
                    author={comment.author}
                    timestamp={comment.timestamp}
                    removeComment={removeComment ? removeComment : undefined}
                    key={index}
                />
                {index < comments.length - 1 ? (
                    <hr
                        style={{ borderTop: "1px solid #bbb", width: "100%" }}
                    />
                ) : (
                    <></>
                )}
            </React.Fragment>
        ));

    return (
        <div className="card-body">
            <div className="commentList">
                <ul className="list-group list-group-flush">{commentNodes}</ul>
            </div>
            {comments.length > itemsCountPerPage && (
                <Pagination
                    activePage={activePage}
                    itemsCountPerPage={itemsCountPerPage}
                    totalItemsCount={comments.length}
                    pageRangeDisplayed={5}
                    onChange={setActivePage}
                    itemClass="page-item"
                    linkClass="page-link"
                />
            )}
        </div>
    );
}
