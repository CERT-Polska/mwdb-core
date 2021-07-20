import React, { Suspense, useContext, useEffect, useState } from "react";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View } from "@mwdb-web/commons/ui";

const SwaggerUI = React.lazy(() => import("swagger-ui-react"));

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
            <Suspense fallback={<div>Loading SwaggerUI...</div>}>
                <SwaggerUI
                    spec={apiSpec}
                    url=""
                    docExpansion="list"
                    onComplete={(swagger) => {
                        swagger.preauthorizeApiKey(
                            "bearerAuth",
                            auth.user.token
                        );
                    }}
                />
            </Suspense>
        </View>
    );
}
