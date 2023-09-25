import { useContext, useEffect, useState } from "react";

import { QueryResultContext } from "../common/QueryResultContext";
import { ResultOptionItem } from "../common/ResultOptionItem";


export function QueryResultJsonAction() {
    const { items } = useContext(QueryResultContext);
    const [url, setUrl] = useState<string>("");

    function generateName() {
        return `file_data_${new Date().toJSON().slice(0, 19)}`;
    }

    async function generateUrl() {
        const data = new Blob([JSON.stringify(items, null, '\t')], { type: 'application/json' })
        setUrl(window.URL.createObjectURL(data));
    }

    useEffect(() => {
        generateUrl();
    }, [])

    return (
        <ResultOptionItem
            url={url}
            key={"jsonOption"}
            title={"Download JSON"}
            download={generateName}
        />
    );
}
