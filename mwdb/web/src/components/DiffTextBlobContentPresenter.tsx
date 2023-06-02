import { useCallback, useState, useEffect, useRef } from "react";

import { IMarker, split as SplitEditor } from "react-ace";
import DiffMatchPatch from "diff-match-patch";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-chrome";

type Props = {
    current: string;
    previous: string;
};

export function DiffTextBlobContentPresenter({ current, previous }: Props) {
    const [markers, setMarkers] = useState<IMarker[][]>([[], []]);
    const editor = useRef<any>();
    // This must be ref instead of state
    // It's used by event handler and it will be overcomplicated
    // to set new handler every time we receive new rowMappings
    const rowMappings = useRef<number[][]>();

    const performDiff = (current: string, previous: string) => {
        const engine = new DiffMatchPatch();
        const chars = engine.diff_linesToChars_(current, previous);
        const lineText1 = chars.chars1;
        const lineText2 = chars.chars2;
        const lineArray = chars.lineArray;
        const diffs = engine.diff_main(lineText1, lineText2, false);
        engine.diff_charsToLines_(diffs, lineArray);
        engine.diff_cleanupSemantic(diffs);
        return diffs;
    };

    function moveCursor(cursor: number[], payload: string) {
        const lines = payload.split(/\r?\n/);
        const newCursor =
            lines.length === 1
                ? [cursor[0] + lines[0].length, cursor[1]]
                : [
                      lines[lines.length - 1].length,
                      cursor[1] + (lines.length - 1),
                  ];
        return newCursor;
    }

    const getDiff = useCallback((current: string, previous: string) => {
        let diff = performDiff(previous, current);
        let cursors: number[][] = [
            [0, 0],
            [0, 0],
        ];
        let markers: IMarker[][] = [[], []];
        let newCursors: number[][] = [[], []];
        let mappings: number[][] = [[], []];
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
                } as IMarker);
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
                } as IMarker);
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

    const editorRef = useCallback((newEditor: any) => {
        function onCursorChange() {
            // Synchronize right-side cursor with left-side
            const split = editor.current.split;
            const mappings = rowMappings.current as number[][];

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
        //@ts-ignore
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
