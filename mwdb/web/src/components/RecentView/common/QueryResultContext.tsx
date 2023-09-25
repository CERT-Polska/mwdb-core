import { BlobData, ConfigData, ObjectData } from "@mwdb-web/types/types";
import { ReactNode, createContext, useMemo, useState } from "react";

interface Props {
    children?: ReactNode;
}
type Objects = ObjectData[] | ConfigData[] | BlobData[];

export const QueryResultContext = createContext<any>(null);
export function QueryResultContextProvider({ children }: Props) {
    const [items, setItems] = useState<Objects | null>(null);

    return (
        <QueryResultContext.Provider value={{ items, setItems }}>
            {children}
        </QueryResultContext.Provider>
    );
}