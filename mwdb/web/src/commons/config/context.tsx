import { ConfigContextValues } from "@mwdb-web/types/context";
import React from "react";

export const ConfigContext = React.createContext<ConfigContextValues>(
    {} as ConfigContextValues
);
