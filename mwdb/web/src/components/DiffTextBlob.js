import React, { Component, useContext } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { split as SplitEditor } from "react-ace";
import DiffMatchPatch from "diff-match-patch";

import "brace/mode/text";
import "brace/theme/chrome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { View } from "@mwdb-web/commons/ui";
import { useRemote } from "@mwdb-web/commons/remotes";

class DiffTextBlobContentPresenter extends Component {
    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.rowMappings = [[], []];
    }

    performDiff(current, previous) {
        let engine = new DiffMatchPatch();
        let chars = engine.diff_linesToChars_(current, previous);
        var lineText1 = chars.chars1;
        var lineText2 = chars.chars2;
        var lineArray = chars.lineArray;
        var diffs = engine.diff_main(lineText1, lineText2, false);
        engine.diff_charsToLines_(diffs, lineArray);
        engine.diff_cleanupSemantic(diffs);
        return diffs;
    }

    getDiff(current, previous) {
        function moveCursor(cursor, payload) {
            let lines = payload.split(/\r?\n/);
            let newCursor =
                lines.length === 1
                    ? [cursor[0] + lines[0].length, cursor[1]]
                    : [
                          lines[lines.length - 1].length,
                          cursor[1] + (lines.length - 1),
                      ];
            return newCursor;
        }
        let diff = this.performDiff(previous, current);
        let cursors = [
            [0, 0],
            [0, 0],
        ];
        let markers = [[], []];
        let newCursors = [[], []];
        let rowMappings = [[], []];
        for (let mark of diff) {
            let oper = mark[0];
            let text = mark[1];
            if (oper === 0) {
                newCursors[0] = moveCursor(cursors[0], text);
                newCursors[1] = moveCursor(cursors[1], text);
            } else if (oper === -1) {
                let start = cursors[1],
                    end = (newCursors[1] = moveCursor(cursors[1], text));
                markers[1].push({
                    startCol: start[0],
                    startRow: start[1],
                    endCol: end[0],
                    endRow: end[1],
                    className: "marker-deleted",
                });
            } else if (oper === 1) {
                let start = cursors[0],
                    end = (newCursors[0] = moveCursor(cursors[0], text));
                markers[0].push({
                    startCol: start[0],
                    startRow: start[1],
                    endCol: end[0],
                    endRow: end[1],
                    className: "marker-added",
                });
            }
            for (let row = cursors[0][1]; row <= newCursors[0][1]; row++) {
                rowMappings[0][row] =
                    cursors[1][1] +
                    (cursors[1][1] === newCursors[1][1]
                        ? 0
                        : row - cursors[0][1]);
            }
            cursors = newCursors.slice();
        }
        this.rowMappings = rowMappings;
        return markers;
    }

    componentDidMount() {
        let split = this.editorRef.current.split;
        split
            .getEditor(0)
            .getSelection()
            .on("changeCursor", () => {
                let sel0 = split.getEditor(0).getSelection();
                let sel1 = split.getEditor(1).getSelection();
                if (
                    this.rowMappings[0][sel0.lead.row] !== undefined &&
                    this.rowMappings[0][sel0.lead.row] !== sel1.lead.row
                )
                    split
                        .getEditor(1)
                        .gotoLine(this.rowMappings[0][sel0.lead.row] + 1);
            });
    }

    render() {
        return (
            <SplitEditor
                ref={this.editorRef}
                mode="text"
                theme="github"
                name="blob-diff"
                splits={2}
                value={[this.props.current, this.props.previous]}
                readOnly
                wrapEnabled
                setOptions={{
                    showInvisibles: true,
                }}
                width="100%"
                fontSize="16px"
                markers={this.getDiff(this.props.current, this.props.previous)}
                editorProps={{ $blockScrolling: true }}
                onScroll={this.doScroll}
            />
        );
    }
}

class DiffView extends Component {
    state = {
        error: null,
    };

    async updateTextBlob() {
        try {
            let currentBlob = await this.props.api.getObject(
                "blob",
                this.props.match.params.current
            );
            let previousBlob = await this.props.api.getObject(
                "blob",
                this.props.match.params.previous
            );
            this.setState({
                current: currentBlob.data,
                previous: previousBlob.data,
            });
        } catch (error) {
            this.setState({ error });
        }
    }

    componentDidMount() {
        this.updateTextBlob();
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) this.updateTextBlob();
    }

    render() {
        const remotePath = this.props.remote
            ? `/remote/${this.props.remote}`
            : "";
        return (
            <View fluid error={this.state.error}>
                {this.state.current && this.state.previous ? (
                    <div className="card-body">
                        <div className="card-header">
                            <div className="media">
                                <div className="align-self-center media-body">
                                    Blob diff
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <table
                                    className="table table-striped table-bordered table-hover"
                                    id="label-table"
                                >
                                    <tbody>
                                        <tr>
                                            <th style={{ width: "49%" }}>
                                                <Link
                                                    to={`${remotePath}/blob/${this.state.current.id}`}
                                                >
                                                    {this.state.current.id}
                                                </Link>
                                            </th>
                                            <td>
                                                <Link
                                                    to={`${remotePath}/diff/${this.state.previous.id}/${this.state.current.id}`}
                                                >
                                                    <button
                                                        onClick={
                                                            this
                                                                .handleMalwareDownload
                                                        }
                                                        target="_self"
                                                        className="btn btn-primary"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon="exchange-alt"
                                                            pull="left"
                                                            size="x"
                                                        />
                                                    </button>
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`${remotePath}/blob/${this.state.previous.id}`}
                                                >
                                                    {this.state.previous.id}
                                                </Link>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <DiffTextBlobContentPresenter
                                    current={this.state.current.content}
                                    previous={this.state.previous.content}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    []
                )}
            </View>
        );
    }
}

function ConnectedDiffView(props) {
    const remote = useRemote();
    const api = useContext(APIContext);
    return <DiffView {...props} remote={remote} api={api} />;
}

export default ConnectedDiffView;
