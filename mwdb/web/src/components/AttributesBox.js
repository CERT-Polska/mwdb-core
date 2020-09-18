import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { Extendable } from '@mwdb-web/commons/extensions';
import ObjectAttributes from "./Attributes";

class AttributesBox extends Component {
    state = {
        isAttributeAddModalOpen: false
    }

    render() {
        return (
            <Extendable ident="attributesBox" object={this.props}>
                <div className={`card card-default ${this.props.className || ''}`}>
                    <div className="card-header">
                        Attributes
                        <Link to="#" className="float-right" 
                              onClick={(ev) => {
                                ev.preventDefault();
                                this.setState({isAttributeAddModalOpen: true});
                        }}>
                            <FontAwesomeIcon icon="plus" pull="left" size="1x"/> 
                            Add
                        </Link>
                    </div>
                    <ObjectAttributes object={this.props}
                                      isModalOpen={this.state.isAttributeAddModalOpen}
                                      onRequestModalClose={
                                          () => this.setState({
                                            isAttributeAddModalOpen: false
                                          })
                                      }/>
                </div>
            </Extendable>
        );
    }
}

export default AttributesBox