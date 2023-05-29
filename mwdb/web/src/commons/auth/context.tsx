import React from "react";
import { AuthContextValues } from "@mwdb-web/types/context";

export const AuthContext = React.createContext<AuthContextValues>(
    {} as AuthContextValues
);
