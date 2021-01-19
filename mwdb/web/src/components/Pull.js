import React, {useState} from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router';

import api from "@mwdb-web/commons/api";
import { View } from "@mwdb-web/commons/ui";


function PullRemote(props) {
    const history = useHistory();
    const [remoteName, setRemoteName] = useState("");
    const [objectIdentifier, setObjectIdentifier] = useState("");
    const [error, setError] = useState(null)
    const [disabledPullButton, setDisabledPullButton] = useState(false)

    async function pullRemote() {
        try {
            const objectData = await api.getObjectRemote(remoteName, objectIdentifier);
            const objectType = ({
                "file": "file",
                "static_config": "config",
                "text_blob": "blob"
            })[objectData.data.type]
            const response = await api.pullObjectRemote(remoteName, objectType, objectIdentifier);
            const viewType = ({
                "file": "sample",
                "static_config": "config",
                "text_blob": "blob"
            })[response.data.type];
            history.push(`/${viewType}/${objectIdentifier}`);
        } catch (error) {
            setDisabledPullButton(false);
            setError(error);
        }
    }

    return (
        <View error={error}>
            <form onSubmit={
                (e) => {
                    e.preventDefault();
                    pullRemote();
                    setDisabledPullButton(true);
                }
            }>
                <div className="form-group">
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <label className="input-group-text">Remote name</label>
                        </div>
                        <select className="custom-select" value={remoteName}
                                onChange={(ev) => setRemoteName(ev.target.value)} required>
                            <option value="" hidden>Select the remote instance name</option>
                                {
                                    props.remotes.sort().map(name =>
                                        <option key={name} value={name}>{name}</option>
                                    )
                                }
                        </select>
                    </div>
                    <div className="input-group-prepend">
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label className="input-group-text">Identifier</label>
                            </div>
                            <input className="form-control" type="text" style={{fontSize: "medium"}}
                                    placeholder="Type object identifier..."
                                    value={objectIdentifier}
                                    onChange={(ev) => setObjectIdentifier(ev.target.value)}
                                    required/>
                        </div>
                    </div>
                </div>
                <input value="Pull from remote" className="btn btn-success" type="submit"
                       disabled={disabledPullButton} />
            </form>
        </View>
    )
}

function mapStateToProps(state, ownProps) {
    return {
        ...ownProps,
        remotes: state.config.config["remotes"],
    }
}

export default connect(mapStateToProps)(PullRemote);
