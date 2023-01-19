import React, {
    useCallback,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
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

function DiffTextBlobContentPresenter({ current, previous }) {
    const [markers, setMarkers] = useState([[], []]);
    const editor = useRef();
    // This must be ref instead of state
    // It's used by event handler and it will be overcomplicated
    // to set new handler every time we receive new rowMappings
    const rowMappings = useRef();

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
    };

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

    const getDiff = useCallback((current, previous) => {
        let diff = performDiff(previous, current);
        let cursors = [
            [0, 0],
            [0, 0],
        ];
        let markers = [[], []];
        let newCursors = [[], []];
        let mappings = [[], []];
        for (let mark of diff) {
            let oper = mark[0];
            let text = mark[1];
            if (oper === 0) {
                newCursors[0] = moveCursor(cursors[0], text);
                newCursors[1] = moveCursor(cursors[1], text);
            } else if (oper === -1) {
                let start, end;
                newCursors[0] = cursors[0];
                newCursors[1] = moveCursor(cursors[1], text);
                start = cursors[1];
                end = newCursors[1];
                markers[1].push({
                    startCol: start[0],
                    startRow: start[1],
                    endCol: end[0],
                    endRow: end[1],
                    className: "marker-deleted",
                });
            } else if (oper === 1) {
                let start, end;
                newCursors[0] = moveCursor(cursors[0], text);
                newCursors[1] = cursors[1];
                start = cursors[0];
                end = newCursors[0];
                markers[0].push({
                    startCol: start[0],
                    startRow: start[1],
                    endCol: end[0],
                    endRow: end[1],
                    className: "marker-added",
                });
            }
            for (let row = cursors[0][1]; row <= newCursors[0][1]; row++) {
                mappings[0][row] =
                    cursors[1][1] +
                    (cursors[1][1] === newCursors[1][1]
                        ? 0
                        : row - cursors[0][1]);
            }
            cursors = newCursors.slice();
        }
        rowMappings.current = mappings;
        setMarkers(markers);
    }, []);

    const editorRef = useCallback((newEditor) => {
        function onCursorChange() {
            // Synchronize right-side cursor with left-side
            const split = editor.current.split;
            const mappings = rowMappings.current;

            const selectionLeft = split.getEditor(0).getSelection();
            const selectionRight = split.getEditor(1).getSelection();

            if (
                mappings[0][selectionLeft.lead.row] !== undefined &&
                mappings[0][selectionLeft.lead.row] !== selectionRight.lead.row
            ) {
                split
                    .getEditor(1)
                    .gotoLine(mappings[0][selectionLeft.lead.row] + 1);
            }
        }
        editor.current = newEditor;
        if (newEditor) {
            newEditor.split
                .getEditor(0)
                .getSelection()
                .on("changeCursor", onCursorChange);
        }
    }, []);

    useEffect(() => {
        getDiff(current, previous);
    }, [getDiff, current, previous]);

    return (
        <SplitEditor
            ref={editorRef}
            mode="text"
            theme="github"
            name="blob-diff"
            splits={2}
            value={[current, previous]}
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
    const { current: currentHash, previous: previousHash } = useParams();
    const [error, setError] = useState(null);
    const [currentBlob, setCurrentBlob] = useState(null);
    const [previousBlob, setPreviousBlob] = useState(null);

    async function updateTextBlob() {
        try {
            let currentBlob = await api.getObject("blob", currentHash);
            let previousBlob = await api.getObject("blob", previousHash);
            setCurrentBlob(currentBlob.data);
            setPreviousBlob(previousBlob.data);
        } catch (error) {
            setError(error);
        }
    }

    const getTextBlob = useCallback(updateTextBlob, [
        api,
        currentHash,
        previousHash,
    ]);

    useEffect(() => {
        getTextBlob();
    }, [getTextBlob]);

    return (
        <View fluid error={error}>
            {currentBlob && previousBlob ? (
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
                                                to={`${remotePath}/blob/${currentBlob.id}`}
                                            >
                                                {currentBlob.id}
                                            </Link>
                                        </th>
                                        <td>
                                            <Link
                                                to={`${remotePath}/diff/${previousBlob.id}/${currentBlob.id}`}
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
                                                to={`${remotePath}/blob/${previousBlob.id}`}
                                            >
                                                {previousBlob.id}
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
                                current={currentBlob.content}
                                previous={previousBlob.content}
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
