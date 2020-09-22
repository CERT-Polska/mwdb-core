import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {TagList} from './Tag';
import api from "@mwdb-web/commons/api";
import { ObjectLink, ActionCopyToClipboard } from '@mwdb-web/commons/ui';
import RelationsAddModal from "./RelationsAddModal";

class RelationsBox extends Component {
    state = {
        isAttributeAddModalOpen: false,
        modalError: ""
    }

    addObjectRelations = async (relation, value) => {
        try {
            if (relation === "child")
                await api.addObjectRelation(this.props.id, value)
            else if (relation === "parent")
                await api.addObjectRelation(value, this.props.id)
            this.props.onObjectUpdate();
            this.setState({isAttributeAddModalOpen: false});
        } catch(error) {
            if(error.response && error.response.status === 404)
                this.handleError("Object not found or incorrect SHA256 hash.")
            else
                this.handleError(error);
        }
    }

    handleError = (error) => {
        this.setState({modalError: error});
    }

    render() {
        const parents = (this.props.parents || [])
            .map((parent, index, array) =>
                <tr key={`parent-${parent.id}`} className="flickerable">
                    <th>parent</th>
                    <td>
                        <span>
                            <ObjectLink {...parent}
                                        diffWith={parent.type === "text_blob" && (array[index + 1] || {}).id}
                                        inline/>
                        </span>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={parent.id} tooltipMessage="Copy sha256 to clipboard"/>
                        </span>
                    </td>
                    <td>
                        <TagList tags={parent.tags}/>
                    </td>
                </tr>
            );

        const children = (this.props.children || [])
            .map((child, index, array) =>
                <tr key={`child-${child.id}`} className="flickerable">
                    <th>child</th>
                    <td>
                        <span>
                            <ObjectLink {...child }
                                        diffWith={child.type === "text_blob" && (array[index + 1] || {}).id}
                                        inline/>
                        </span>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={child.id} tooltipMessage="Copy sha256 to clipboard"/>
                        </span>
                    </td>
                    <td>
                        <TagList tags={child.tags}/>
                    </td>
                </tr>
            );
        return (
            <div className={`card card-default ${this.props.className || ''}`}>
                <div className="card-header">
                    { this.props.header || "Relations" }
                    <Link to="#" className="float-right"
                          onClick={(ev) => {
                              ev.preventDefault();
                              this.setState({
                                  isAttributeAddModalOpen: true,
                                  modalError: ""
                              });
                          }}>
                            <FontAwesomeIcon icon="plus" pull="left" size="1x"/>
                            Add
                    </Link>
                </div>
                {
                    parents.length + children.length > 0 ?
                    <table className="table table-striped table-bordered table-hover" id="rel_table">
                        <tbody id="rel_body">
                        { parents }
                        { children }
                        </tbody>
                    </table> : <div className="card-body text-muted">No relations to display</div>
                }
                <RelationsAddModal isOpen={this.state.isAttributeAddModalOpen}
                                   error={this.state.modalError}
                                   onSubmit={this.addObjectRelations}
                                   onError={this.handleError}
                                   onRequestModalClose={
                                       () => this.setState({
                                           isAttributeAddModalOpen: false,
                                       })
                                   }/>
            </div>
        );
    }
}

class MultiRelationsBox extends Component {
    render() {
        let TypedRelationsBox = (props) => {
            let filterByType = function(arr) { return arr.filter(e => e.type === props.type) }
            let filteredElements = {
                parents: filterByType(props.parents),
                children: filterByType(props.children)
            }
            if(filteredElements.parents.length + filteredElements.children.length > 0)
                return <RelationsBox {...filteredElements} header={props.header} id={this.props.id} onObjectUpdate={this.props.onObjectUpdate}/>
            else
                return <div/>
        }

        let parents = this.props.parents;
        let children = this.props.children;
        let className = this.props.className || '';
        return (
            parents && children && (parents.length + children.length > 0) ?
                <div className={className}>
                    <TypedRelationsBox header="Related samples" type="file" {...{parents, children}} />
                    <TypedRelationsBox header="Related configs" type="static_config" {...{parents, children}}/>
                    <TypedRelationsBox header="Related blobs" type="text_blob" {...{parents, children}}/>
                </div> :
                <RelationsBox className={className} id={this.props.id} onObjectUpdate={this.props.onObjectUpdate}/>
        )
    }
}

export default MultiRelationsBox;
