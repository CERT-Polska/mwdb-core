import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useRemote } from "@mwdb-web/commons/remotes";
import { Alert } from "@mwdb-web/commons/ui";

import RemoteAPI from "./RemoteAPI";

import RecentSamples from "../RecentSamples";
import RecentConfigs from "../RecentConfigs";
import RecentBlobs from "../RecentBlobs";
import ShowSample from "../ShowSample";
import ShowConfig from "../ShowConfig";
import ShowTextBlob from "../ShowTextBlob";
import DiffTextBlob from "../DiffTextBlob";
import Search from "../Search";

export default function RemoteViews() {
    const remote = useRemote();
    const { path } = useRouteMatch();
    const message = `Remote view of ${remote}`;
    return (
        <RemoteAPI>
            <div className="container-fluid">
                <Alert warning={message} />
            </div>
            <Switch>
                <Route exact path={path}>
                    <RecentSamples />
                </Route>
                <Route exact path={`${path}/configs`}>
                    <RecentConfigs />
                </Route>
                <Route exact path={`${path}/blobs`}>
                    <RecentBlobs />
                </Route>
                <Route path={`${path}/file/:hash`}>
                    <ShowSample />
                </Route>
                <Route path={`${path}/config/:hash`}>
                    <ShowConfig />
                </Route>
                <Route path={`${path}/blob/:hash`}>
                    <ShowTextBlob />
                </Route>
                <Route exact path={`${path}/diff/:current/:previous`}>
                    <DiffTextBlob />
                </Route>
                <Route exact path={`${path}/search`}>
                    <Search />
                </Route>
            </Switch>
        </RemoteAPI>
    );
}
