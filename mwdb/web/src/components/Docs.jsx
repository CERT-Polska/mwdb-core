import React, { Suspense, useEffect, useState } from "react";

import { api } from "@mwdb-web/commons/api";
import { localStorageAuthKey } from "@mwdb-web/commons/auth";
import { View } from "@mwdb-web/commons/ui";

const SwaggerUI = React.lazy(() => import("swagger-ui-react"));

export default function Docs() {
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

    function requestInterceptor(req) {
        const token = JSON.parse(
            localStorage.getItem(localStorageAuthKey)
        ).token;

        if (token) {
            req.headers.Authorization = `Bearer ${token}`;
        }

        return req;
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
                    requestInterceptor={requestInterceptor}
                />
            </Suspense>
        </View>
    );
}
