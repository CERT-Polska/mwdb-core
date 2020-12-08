import React, {Component} from 'react';

import api from "@mwdb-web/commons/api";
import { HexView } from "@mwdb-web/commons/ui";

class ShowSamplePreview extends Component {
    state = {
        content: ""
    }

    async updateSample() {
        let fileId = this.props.hash;
        let fileUrlResponse = await api.requestFileDownload(fileId)
        let fileContentResponse = await api.axios.get(fileUrlResponse.data.url, {
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
        })
        this.setState({content: fileContentResponse.data})
    }

    componentDidMount() {
        this.updateSample();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.hash !== this.props.hash)
            this.updateSample();
    };

    render() {
        return <HexView content={this.state.content} mode={this.props.mode} showInvisibles/>
    }
}

export default ShowSamplePreview;
