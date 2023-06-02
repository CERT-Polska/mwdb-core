import { Group } from "./types";

export type TagProps = {
    tag: string;
    searchEndpoint?: string;
    tagClick?: (ev: React.MouseEvent, tag: string) => void;
    tagRemove?: (ev: React.MouseEvent, tag: string) => void;
    searchable?: boolean;
    deletable?: boolean;
    filterable?: boolean;
};

export type GroupBadgeProps = {
    group: Partial<Group>;
    basePath?: string;
    clickable?: boolean;
};

export type AuthProviderProps = {
    children: JSX.Element;
};

export type APIProviderProps = {
    children: JSX.Element;
};

export type RecentRowProps<T> = T & {
    addToQuery: (field: string, value: string) => void;
};
