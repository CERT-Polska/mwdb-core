import React, {Component} from 'react';
import Autocomplete from 'react-autocomplete';

import api from "@mwdb-web/commons/api";
import { RefString, DateString, ObjectLink, ConfirmationModal } from "@mwdb-web/commons/ui";

class ShareItem extends Component {
    render() {
        let fieldStyle = {
            wordBreak: 'break-all'
        };
        const isCurrentObject = this.props.related_object_dhash === this.props.id
        const isUploader = this.props.related_user_login === this.props.group_name

        if (!isCurrentObject) fieldStyle.backgroundColor = 'lightgray';

        return (
            <tr style={fieldStyle}>
                <td>
                    <ObjectLink type="group" id={this.props.group_name}/>
                    {(isCurrentObject && isUploader) && <span className="ml-2">(uploader)</span>}
                </td>
                <td><RefString
                    reason_type={this.props.reason_type}
                    related_object_dhash={this.props.related_object_dhash}
                    related_object_type={this.props.related_object_type}
                    related_user_login={this.props.related_user_login} />
                </td>
                <td><DateString date={this.props.access_time}/></td>
            </tr>
        )
    }
}

class ShareForm extends Component {
    state = {
        group: "",
    }

    handleSubmit = (e) => {
        e.preventDefault();
        if (!this.state.group) {
            return;
        }

        this.props.onSubmit(this.state.group);
        this.setState({
            group: ""
        });
    };

    render() {
        return (
            <form className="tagForm" onSubmit={this.handleSubmit}>
                <Autocomplete
                        value={this.state.group}
                        inputProps={{id: 'states-autocomplete'}}
                        getItemValue={(item) => item}
                        shouldItemRender={(item, value) => {
                            return (item.toLowerCase().indexOf(value.toLowerCase()) !== -1);
                        }}
                        items={this.props.groups}
                        onChange={event => this.setState({group: event.target.value})}
                        onSelect={value => this.setState({group: value})}
                        renderInput={(props) =>
                            <div className="input-group">
                                <input {...props} className='form-control' placeholder="Share with group"/>
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
                            <div
                                className={`item ${isHighlighted ? 'item-highlighted' : ''}`}
                                key={item}
                            >{item}</div>
                        )}
                />
            </form>
        );
    };
}

class SharesBox extends Component {
    state = {
        groups: [],
        items: [],
        isModalOpen: false
    }

    updateShares = async () => {
        if(typeof this.props.id === 'undefined')
            return;
        try {
            let response = await api.getObjectShares(this.props.id)
            this.setState({
                groups: response.data.groups,
                items: response.data.shares
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    };

    handleShare = (group) => {
        this.setState({
            isModalOpen: true,
            shareReceiver: group
        })
    }

    doShare = async (group) => {
        try {
            this.setState({isModalOpen: false})
            await api.shareObjectWith(this.props.id, group)
            this.updateShares();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    componentDidUpdate = (prevProps) => {
        if (prevProps.id !== this.props.id)
            this.updateShares();
    };

    render() {
        return (
        <div className="card card-default">
            <ConfirmationModal isOpen={this.state.isModalOpen}
                               onRequestClose={() => this.setState({isModalOpen: false})}
                               message={`Share the sample and all its descendants with ${this.state.shareReceiver}?`}
                               onConfirm={() => this.doShare(this.state.shareReceiver)}
                               confirmText="Share"
                               buttonStyle="bg-success"/>

            <div className="card-header">
                <div className="media">
                    <div className="align-self-center media-body">
                        Shares
                    </div>
                </div>
            </div>
            <table className="table table-striped table-bordered wrap-table">
                <thead>
                    <tr>
                        <th key="group">Group name</th>
                        <th key="reason">Reason</th>
                        <th key="timestamp">Access time</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.items
                            .sort((a, b) => {
                                if(a.related_object_dhash !== b.related_object_dhash)
                                {
                                    // Current object should be on top
                                    if(b.related_object_dhash === this.props.id) return 1;
                                    if(a.related_object_dhash === this.props.id) return -1;
                                    // Inherited entries order by dhash
                                    if(a.related_object_dhash > b.related_object_dhash) return 1;
                                    if(a.related_object_dhash < b.related_object_dhash) return -1;
                                }
                                const a_time = Date.parse(a.access_time);
                                const b_time = Date.parse(b.access_time);
                                // The same dhash order by time
                                if(a_time > b_time) return 1;
                                if(a_time < b_time) return -1;
                                return 0;
                            })
                            .map((item, idx) => <ShareItem key={idx} id={this.props.id} {...item}/>)
                    }
                </tbody>
            </table>
            <ShareForm onSubmit={this.handleShare} groups={this.state.groups}/>
        </div>)
    }
}

export default SharesBox;
