import { AuthContextValues } from "@mwdb-web/types/types";
import React from "react";

export const AuthContext = React.createContext<AuthContextValues>(
    {} as AuthContextValues
);
