import { BlobData, ConfigData, ObjectData } from "@mwdb-web/types/types";
import { ReactNode, createContext, useMemo, useState } from "react";

interface Props {
    children?: ReactNode;
}
type Objects = ObjectData[] | ConfigData[] | BlobData[];

export const QueryContext = createContext<any>(null);
export function QueryContextProvider({ children }: Props) {
    const [items, setItems] = useState<Objects | null>(null);

    return (
        <QueryContext.Provider value={{ items, setItems }}>
            {children}
        </QueryContext.Provider>
    );
}