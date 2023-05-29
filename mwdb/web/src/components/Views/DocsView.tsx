import React, { Suspense, useEffect, useState } from "react";

import { api } from "@mwdb-web/commons/api";
import { localStorageAuthKey } from "@mwdb-web/commons/auth";
import { View } from "@mwdb-web/commons/ui";
import { isEmpty } from "lodash";

const SwaggerUI = React.lazy(() => import("swagger-ui-react"));

export function DocsView() {
    const [apiSpec, setApiSpec] = useState<object>({});

    async function updateSpec() {
        const spec = await api.getServerDocs();

        // Server variables delivered with spec doesn't work well in swagger-ui-react
        spec.data.servers = [
            {
                url: new URL("/", document.baseURI).href,
                description: "MWDB API endpoint",
            },
        ];
        setApiSpec(spec.data);
    }

    function requestInterceptor(req: Record<string, any>) {
        let token: string = "";
        const authData = localStorage.getItem(localStorageAuthKey);
        if (authData !== null) {
            token = JSON.parse(authData).token;
        }

        if (!isEmpty(token)) {
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
