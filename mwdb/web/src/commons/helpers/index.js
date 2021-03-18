import _ from "lodash";

export { default as downloadData } from "./download";
export * from "./search";
export * from "./filesize";

export const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export function intersperse(arr, arr_with) {
    if (!Array.isArray(arr_with)) arr_with = [arr_with];
    return _.flatten(
        arr.reduce(
            (p, c, idx, arr) =>
                p.concat([c, idx < arr.length - 1 ? arr_with : []]),
            []
        )
    );
}

export function mapObjectType(objectType) {
    return (
        {
            object: "object",
            file: "file",
            static_config: "config",
            text_blob: "blob",
        }[objectType] || objectType
    );
}
