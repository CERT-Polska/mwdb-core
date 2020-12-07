import React, {Component} from 'react';
import MultiRelationsBox from './Relations';
import CommentBox from './Comments';
import TagBox from './Tag';
import ShareBox from "./Shares";
import AttributesBox from "./AttributesBox"
import { Extendable } from "@mwdb-web/commons/extensions";

export default class ShowObject extends Component {
    render() {
        let ObjectPresenter = this.props.objectPresenterComponent;
        return (
            <div className="card-body">
                <Extendable ident="showObject" object={this.props.object}>
                    <div className="row">
                        <div className="col-md-7">
                            <Extendable ident="showObjectLeftColumn" object={this.props.object}>
                                <div className="card">
                                    <ObjectPresenter {...this.props.object} history={this.props.history}
                                                     onObjectUpdate={this.props.onObjectUpdate}/>
                                </div>
                                { this.props.children }
                                <ShareBox id={this.props.object.id} />
                            </Extendable>
                        </div>
                        <div className="col-md-5">
                            <Extendable ident="showObjectRightColumn" object={this.props.object}>
                                <TagBox id={this.props.object.id} searchEndpoint={this.props.searchEndpoint}/>
                                <MultiRelationsBox id={this.props.object.id} parents={this.props.object.parents} children={this.props.object.children}
                                                   onObjectUpdate={this.props.onObjectUpdate}/>
                                <AttributesBox {...this.props.object}/>
                                <CommentBox id={this.props.object.id}/>
                            </Extendable>
                        </div>
                    </div>
                </Extendable>
            </div>
        );
    }
}
