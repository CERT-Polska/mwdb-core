import { ConfigContextValues } from "@mwdb-web/types/types";
import React from "react";

export const ConfigContext = React.createContext<ConfigContextValues>(
    {} as ConfigContextValues
);
