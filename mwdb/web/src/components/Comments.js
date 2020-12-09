import React, {Component} from 'react';
import readableTime from 'readable-timestamp';
import Pagination from "react-js-pagination";
import { connect } from 'react-redux';

import _ from 'lodash';
import api from "@mwdb-web/commons/api";
import { Identicon, ConfirmationModal } from "@mwdb-web/commons/ui";
import { GlobalContext } from "@mwdb-web/commons/context";

class Comment extends Component {
    render() {
        return (
            <li className="media" style={{wordBreak: "break-all"}}>
                <div className="align-self-center mr-3">
                    <Identicon data={this.props.author} size="45" />
                </div>
                <div className="media-body" >
                     <h4 className="media-heading user_name">{this.props.author}</h4>
                    <span>
                    {
                        _.flatMap(this.props.comment.split("\n"), 
                                (value, index, array) =>
                                    array.length - 1 !== index
                                    ? [value, <br/>]
                                    : value)
                    }
                    </span>
                    <p>
                        {
                            this.props.removable &&
                            <button className="btn btn-link p-0 remove-comment-link"
                                    onClick={() => this.props.removeComment(this.props.id)}>Remove</button>
                        }
                    </p>
                </div>
                <p className="float-right">
                    <small>{readableTime(new Date(this.props.timestamp))}</small>
                </p>
            </li>

        );
    }
}


class CommentBox extends Component {
    itemsCountPerPage = 15;

    state = {
        comments: [],
        activePage: 1,
        modalIsOpen: false
    }

    static contextType = GlobalContext;

    openModal(comment_id) {
        this.setState({modalIsOpen: true, commentToRemove: comment_id});
    };

    closeModal = () => {
        this.setState({modalIsOpen: false});
    };

    async updateComments() {
        if(this.props.id === undefined)
            return;
        try {
            let response = await api.getObjectComments(this.props.id)
            this.setState({
                comments: response.data
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props)
            this.updateComments();
    };

    componentDidMount() {
        this.updateComments();
    };

    handleCommentSubmit = async (comment) => {
        try {
            await api.addObjectComment(this.props.id, comment)
            this.updateComments();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    handleRemoveComment = (comment_id) => {
        this.openModal(comment_id);
    };

    async removeComment(comment_id) {
        try {
            await api.removeObjectComment(this.props.id, comment_id)
            this.updateComments();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        } finally {
            this.closeModal();
        }
    };

    handlePageChange = (pageNumber) => {
        this.setState({activePage: pageNumber});
    };

    render() {
        return (
            <div className={`card card-default ${this.props.className || ''}`}>
                <ConfirmationModal isOpen={this.state.modalIsOpen}
                                   onRequestClose={this.closeModal}
                                   onConfirm={(e) => this.removeComment(this.state.commentToRemove)}
                                   message={`Remove the comment?`}
                                   confirmText="Remove"/>
                <div className="card-header">Comments</div>
                <div className="card-body">
                    <CommentList
                        canRemoveComments={this.props.canRemoveComments}
                        removeComment={this.handleRemoveComment}
                        data={this.state.comments
                        .sort(function (a, b) {
                            return new Date(b.timestamp) - new Date(a.timestamp);
                        })
                        .slice((this.state.activePage-1)*this.itemsCountPerPage, this.itemsCountPerPage*this.state.activePage)} />

                </div>
                {
                    this.state.comments.length > this.itemsCountPerPage &&
                    <Pagination activePage={this.state.activePage}
                            itemsCountPerPage={this.itemsCountPerPage} totalItemsCount={this.state.comments.length}
                            pageRangeDisplayed={5} onChange={this.handlePageChange}
                            itemClass="page-item" linkClass="page-link"/>
                }
                {
                    this.props.canAddComments &&
                    <CommentForm onCommentSubmit={this.handleCommentSubmit} />
                }
            </div>
        );
    }
}

class CommentList extends Component {
    render(){
        let commentNodes = this.props.data
            .map((comment, index) => {
            return (
                <Comment id={comment.id} 
                         comment={comment.comment} 
                         author={comment.author} 
                         timestamp={comment.timestamp}
                         removeComment={this.props.removeComment} 
                         key={index} 
                         removable={this.props.canRemoveComments}/>
                );
            });

        return (
            <div className="commentList">
                {
                    commentNodes.length > 0 ?
                    <ul className="list-group list-group-flush">
                        {commentNodes}
                    </ul>
                        : <div className="text-muted">No comments to display</div>
                }
            </div>
        );
    }
}


class CommentForm extends Component {
    state = {
        text: ""
    }

    handleSubmit = (e) => {
        e && e.preventDefault();
        if(!this.state.text)
            return;

        this.props.onCommentSubmit(this.state.text);
        this.setState({
            text: ""
        });
    }

    updateInputValue(what, evt) {
        let newState = {};
        newState[what] = evt.target.value;
        this.setState(newState);
    }

    render() {
        return (
            <form className="commentForm" onSubmit={this.handleSubmit}>
                <div className="input-group">
                    <textarea className="form-control" placeholder="Say something..." 
                              value={this.state.text} 
                              onChange={evt => this.updateInputValue("text",evt)}
                              onKeyDown={evt => evt.ctrlKey && evt.keyCode === 13 && this.handleSubmit()}/>
                    <div className="input-group-append">
                        <input className="btn btn-outline-primary" type="submit" value="Post" />
                    </div>
                </div>
                <div className="form-hint">Press Ctrl+Enter to send comment</div>
            </form>
        );
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canRemoveComments: state.auth.loggedUser.capabilities.includes("removing_comments"),
        canAddComments: state.auth.loggedUser.capabilities.includes("adding_comments"),
    }
}

export default connect(mapStateToProps)(CommentBox);