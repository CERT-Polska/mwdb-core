import React, {Component} from 'react';
import Autocomplete from 'react-autocomplete';
import { connect } from 'react-redux';
import {Link} from "react-router-dom";

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

import api from "@mwdb-web/commons/api";
import { GlobalContext } from "@mwdb-web/commons/context";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { getStyleForTag, ConfirmationModal } from "@mwdb-web/commons/ui";

export class Tag extends Component {
    static defaultProps = {
        searchable: true
    }
    render() {
        let badgeStyle = getStyleForTag(this.props.tag)
        return (
            <div className="tag">
                <span className={"d-flex badge badge-" + badgeStyle} 
                      onMouseEnter={this.onMouseEnter} 
                      onMouseLeave={this.onMouseLeave}>
                    {
                        this.props.searchable ? (
                            <Link to={makeSearchLink("tag", this.props.tag, false, this.props.searchEndpoint)}
                                  className="tag-link"
                                  onClick={ev => this.props.tagClick && this.props.tagClick(ev, this.props.tag)}>{this.props.tag}</Link>
                        ) : (
                            <span>{this.props.tag}</span>
                        )
                    }
                    {
                        (this.props.deletable || this.props.filterable) &&
                        <a className="tag-link"
                           href="#tag"
                           onClick={ev => this.props.tagRemove(ev, this.props.tag)}>
                            <FontAwesomeIcon icon={this.props.filterable ? "ban" : "times"} pull="right" size="1x"/>
                        </a>
                    }
                </span>
            </div>
        );
    };
}

class TagForm extends Component {
    state = {
        text: "",
        tags: []
    }

    static contextType = GlobalContext;

    handleSubmit = (e) => {
        e.preventDefault();
        if (!this.state.text) {
            return;
        }

        this.props.onTagSubmit(this.state.text);
        this.setState({
            text: "",
            tags: []
        });
    };

    async updateInputValue(value) {
        try {
            this.setState({text: value});
            let response = await api.getTags(value);
            this.setState({
                tags: response.data.map(t => t.tag),
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    get tagItems() {
        let typed = this.state.text.trim();
        if(!typed || typed === "")
            return [];
        return this.state.tags;
    }

    render() {
        return (
            <form className="tagForm" onSubmit={this.handleSubmit}>
                <Autocomplete
                    value={this.state.text}
                    inputProps={{id: 'tags-autocomplete'}}
                    getItemValue={(item) => item}
                    shouldItemRender={(item, value) => {
                        return (item.toLowerCase().indexOf(value.toLowerCase()) !== -1);
                    }}
                    items={this.tagItems}
                    onChange={event => this.updateInputValue(event.target.value)}
                    onSelect={value => this.updateInputValue(value)}
                    renderInput={(props) =>
                        <div className="input-group">
                            <input {...props} className="form-control" type="text" placeholder="Add tag"/>
                            <div className="input-group-append">
                                <input className="btn btn-outline-primary" type="submit" value="Add"/>
                            </div>
                        </div>
                    }
                    wrapperStyle={{display:"block"}}
                    renderMenu={children =>
                        <div className={"dropdown-menu " + (children.length !== 0 ? "show" : "")}>
                            {
                                children.map(c =>
                                    <a key={c} href="#dropdown" className="dropdown-item" style={{"cursor": "pointer"}}>
                                        {c}
                                    </a>
                                )
                            }
                        </div>
                    }
                    renderItem={(item, isHighlighted) => (
                        <div className={`item ${isHighlighted ? 'item-highlighted' : ''}`}
                             key={item}>
                            <Tag tag={item} tagClick={ev => ev.preventDefault()}/>
                        </div>
                    )}
                />
            </form>
        );
    };
}

export class TagList extends Component {
    render() {
        return <React.Fragment>
            {
                this.props.tags
                .sort((a, b) => (a.tag > b.tag) ? 1 : -1)
                .map((c) => <Tag tag={c.tag} key={c.tag} {...this.props}/>)
            }
        </React.Fragment>
    }
}

class TagBox extends Component {
    state = {
        tags: [],
        modalIsOpen: false,
        tagToRemove: ""
    }

    static contextType = GlobalContext;

    openModal = (tag) => {
        this.setState({modalIsOpen: true, tagToRemove: tag});
    };

    closeModal = () => {
        this.setState({modalIsOpen: false});
    };

    updateTags = async () => {
        if (typeof this.props.id === 'undefined')
            return;
        try {
            let response = await api.getObjectTags(this.props.id)
            let tags = response.data;
            this.setState({tags});
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    componentDidUpdate = (prevProps) => {
        if (prevProps !== this.props)
            this.updateTags();
    };

    componentDidMount = () => {
        this.updateTags();
    };

    handleTagSubmit = async (tag) => {
        try {
            await api.addObjectTag(this.props.id, tag)
            this.updateTags();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    handleTagRemove = (ev, tag) => {
        this.openModal(tag);
    };

    tagRemove = async (tag) => {
        try {
            await api.removeObjectTag(this.props.id, tag)
            this.updateTags();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        } finally {
            this.closeModal()
        }
    };

    render() {
        return (
            <div className={`card card-default ${this.props.className || ''}`}>
                <ConfirmationModal isOpen={this.state.modalIsOpen}
                                   onRequestClose={this.closeModal}
                                   onConfirm={(e) => this.tagRemove(this.state.tagToRemove)}
                                   message={`Remove tag ${this.state.tagToRemove}?`}
                                   confirmText="Remove"/>
                <div className="card-header">
                    Tags
                </div>
                <div className="card-body">
                    {
                        this.state.tags.length > 0
                        ? <TagList tags={this.state.tags}
                                   tagRemove={this.handleTagRemove}
                                   deletable={this.props.canRemoveTags}
                                   searchEndpoint={this.props.searchEndpoint}/>
                        : <div className="text-muted">No tags to display</div>
                    }
                </div>
                {
                    this.props.canAddTags &&
                    <TagForm onTagSubmit={this.handleTagSubmit}/>
                }
            </div>
        );
    };
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canRemoveTags: state.auth.loggedUser.capabilities.includes("removing_tags"),
        canAddTags: state.auth.loggedUser.capabilities.includes("adding_tags"),
    }
}
export default connect(mapStateToProps)(TagBox);
