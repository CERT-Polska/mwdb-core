export { default as ShowObject } from "./ShowObject";

export { default as RelationsTab } from "./Views/RelationsTab";
export { default as LatestConfigTab } from "./Views/LatestConfigTab";

export { default as DownloadAction } from "./Actions/DownloadAction";
export { default as FavoriteAction } from "./Actions/FavoriteAction";
export { default as RemoveAction } from "./Actions/RemoveAction";
export { default as UploadChildAction } from "./Actions/UploadChildAction";
export { default as PushAction } from "./Actions/PushAction";
export { default as PullAction } from "./Actions/PullAction";

export { ObjectContext } from "@mwdb-web/commons/context";
export {
    ObjectTab,
    ObjectAction,
    TabContext,
    useTabContext,
} from "@mwdb-web/commons/ui";
