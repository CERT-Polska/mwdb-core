import { useContext, useEffect, useState } from "react";

import { QueryResultContext } from "../common/QueryResultContext";
import { ResultOptionItem } from "../common/ResultOptionItem";
import { ObjectData } from "@mwdb-web/types/types";


export function QueryResultHashesAction() {
    const { items } = useContext(QueryResultContext);
    const [url, setUrl] = useState<string>("");

    function generateName() {
        return `hashes_${new Date().toJSON().slice(0, 19)}`;
    }

    async function generateUrl() {
        const hashes = items.map((item: ObjectData) => item.sha256);
        const data = new Blob([JSON.stringify(hashes, null, '\t')], { type: 'application/json' })
        setUrl(window.URL.createObjectURL(data));
    }

    useEffect(() => {
        generateUrl();
    }, [])

    return (
        <ResultOptionItem
            url={url}
            key={"hashesOption"}
            title={"Download Hashes"}
            download={generateName}
        />
    );
}
