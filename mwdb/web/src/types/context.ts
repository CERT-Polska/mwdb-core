import { api } from "@mwdb-web/commons/api";
import {
    AttributeDefinition,
    Capabality,
    Group,
    ObjectType,
    ServerInfo,
    User,
} from "./types";
import {
    GetRemoteObjectCountResponse,
    GetRemoteObjectListResponse,
} from "./api";

export type TabContextValues = {
    tab?: string;
    subTab?: string;
    getTabLink: (tab: string, subtab?: string) => string;
    setComponent: (newComponent: React.ComponentType) => void;
    setActions: (actions: JSX.Element[]) => void;
};

export type ConfigContextValues = {
    config: Partial<ServerInfo>;
    configError: unknown;
    isReady: boolean;
    update: () => Promise<void>;
    pendingUsers: User[];
    getPendingUsers: () => Promise<void>;
};

export type AuthContextValues = {
    user: User;
    isAuthenticated: boolean;
    isAdmin: boolean;
    hasCapability: (cap: Capabality) => boolean;
    refreshSession: () => Promise<void>;
    updateSession: (newSession: User) => void;
    logout: (error?: string) => void;
    oAuthLogout: () => Promise<any>;
};

export type ApiContextValues = typeof api & {
    remote?: string;
};

export type RemoteApiContextValues = ApiContextValues & {
    getObjectCount: (
        type: ObjectType,
        query: string
    ) => GetRemoteObjectCountResponse;
    getObjectList: (
        type: ObjectType,
        older_than: string,
        query: string
    ) => GetRemoteObjectListResponse;
};

export type ProfileOutletContext = {
    getUser: () => Promise<void>;
    setCapabilitiesToDelete: (cap: Capabality) => void;
    profile: User;
};

export type AttributeOutletContext = {
    attribute: AttributeDefinition;
    getAttribute: () => void;
};

export type UserOutletContext = {
    group: User;
    getGroup: () => Promise<void>;
};

export type GroupOutletContext = {
    group: Group;
    getGroup: () => Promise<void>;
};
