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
            let response;
            let type = ({
                "file": "file",
                "static_config": "config",
                "text_blob": "blob"
            })
            response = await api.getApiRemote(remoteName, `object/${objectIdentifier}`);
            response = await api.pullObjectRemote(remoteName, type[response.data.type], objectIdentifier);
            type["file"] = "sample";
            history.push(`/${type[response.data.type]}/${objectIdentifier}`);
        } catch (error) {
            setDisabledPullButton(false);
            setError(error);
        }
    }

    return (
        <View error={error}>
            <form>
                <div className="form-group">
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <label className="input-group-text">Remote name</label>
                        </div>
                        <select className="custom-select" value={remoteName}
                                onChange={(ev) => setRemoteName(ev.target.value)}>
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
                                    onChange={(ev) => setObjectIdentifier(ev.target.value)}/>
                        </div>
                    </div>
                </div>
                <input value="Pull from remote" className="btn btn-success" type="button"
                       onClick={
                           (e) => {
                               e.preventDefault();
                               pullRemote();
                               setDisabledPullButton(true);
                           }
                       }
                       disabled = {disabledPullButton} />
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
