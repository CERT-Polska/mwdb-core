import React, { useContext, useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View } from "@mwdb-web/commons/ui";

export default function Docs() {
    const auth = useContext(AuthContext);
    const [apiSpec, setApiSpec] = useState({});

    async function updateSpec() {
        const spec = await api.getServerDocs();

        // Server variables delivered with spec doesn't work well in swagger-ui-react
        spec.data["servers"] = [
            {
                url: new URL("/", document.baseURI).href,
                description: "MWDB API endpoint",
            },
        ];
        setApiSpec(spec.data);
    }

    useEffect(() => {
        updateSpec();
    }, []);

    return (
        <View ident="docs">
            <SwaggerUI
                spec={apiSpec}
                url=""
                docExpansion="list"
                onComplete={(swagger) => {
                    swagger.preauthorizeApiKey("bearerAuth", auth.user.token);
                }}
            />
        </View>
    );
}
