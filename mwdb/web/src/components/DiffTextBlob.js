import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchangeAlt } from "@fortawesome/free-solid-svg-icons";
import { split as SplitEditor } from "react-ace";
import DiffMatchPatch from "diff-match-patch";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-chrome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { View } from "@mwdb-web/commons/ui";
import { useRemote } from "@mwdb-web/commons/remotes";

function DiffTextBlobContentPresenter(props){
    const [rowMappings, setRowMappings] = useState([[], []])
    const [markers, setMarkers] = useState([[], []])
    const editorRef = useRef()

    const performDiff = (current, previous) => {
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

    const getDiff = (current, previous) => {
        let diff = performDiff(previous, current);
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
        setRowMappings(rowMappings);
        setMarkers(markers)
    }

    useEffect(() => {
        getDiff(props.current, props.previous)
        let split = editorRef.current.split;
        split
            .getEditor(0)
            .getSelection()
            .on("changeCursor", () => {
                let sel0 = split.getEditor(0).getSelection();
                let sel1 = split.getEditor(1).getSelection();
                if (
                    rowMappings[0][sel0.lead.row] !== undefined &&
                    rowMappings[0][sel0.lead.row] !== sel1.lead.row
                )
                    split
                        .getEditor(1)
                        .gotoLine(rowMappings[0][sel0.lead.row] + 1);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SplitEditor
            ref={editorRef}
            mode="text"
            theme="github"
            name="blob-diff"
            splits={2}
            value={[props.current, props.previous]}
            readOnly
            wrapEnabled
            setOptions={{
                showInvisibles: true,
            }}
            width="100%"
            fontSize="16px"
            markers={markers}
            editorProps={{ $blockScrolling: true }}
        />
    );

}

export default function DiffTextBlob() {
    const remote = useRemote();
    const remotePath = remote ? `/remote/${remote}` : "";
    const api = useContext(APIContext);
    const params = useParams();
    const [error, setError] = useState(null)
    const [current, setCurrent] = useState(null)
    const [previous, setPrevious] = useState(null)

    async function updateTextBlob() {
        try {
            let currentBlob = await api.getObject(
                "blob",
                params.current
            );
            let previousBlob = await api.getObject(
                "blob",
                params.previous
            );
            setCurrent(currentBlob.data)
            setPrevious(previousBlob.data)
        } catch (error) {
            setError(error)
        }
    }

    useEffect(() => {
        updateTextBlob();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View fluid error={error}>
            {current && previous ? (
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
                                                to={`${remotePath}/blob/${current.id}`}
                                            >
                                                {current.id}
                                            </Link>
                                        </th>
                                        <td>
                                            <Link
                                                to={`${remotePath}/diff/${previous.id}/${current.id}`}
                                            >
                                                <button
                                                    target="_self"
                                                    className="btn btn-primary"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faExchangeAlt}
                                                        pull="left"
                                                        size="x"
                                                    />
                                                </button>
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                to={`${remotePath}/blob/${previous.id}`}
                                            >
                                                {previous.id}
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
                                current={current.content}
                                previous={previous.content}
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
