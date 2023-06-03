import { api } from "@mwdb-web/commons/api";
import {
    AttributeDefinition,
    BlobData,
    Capability,
    ConfigData,
    Group,
    ObjectData,
    ObjectOrConfigOrBlobData,
    ObjectType,
    ServerInfo,
    User,
} from "./types";
import {
    GetRemoteObjectCountResponse,
    GetRemoteObjectListResponse,
} from "./api";
import { Provider } from "react";

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
    user: {
        capabilities: Capability[];
        groups: string[];
        login: string;
        provider: unknown | null;
    };
    isAuthenticated: boolean;
    isAdmin: boolean;
    hasCapability: (cap: Capability) => boolean;
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
    setCapabilitiesToDelete: (cap: Capability) => void;
    profile: User;
};

export type AttributeOutletContext = {
    attribute: AttributeDefinition;
    getAttribute: () => void;
};

export type UserOutletContext = {
    user: User;
    getUser: () => Promise<void>;
};

export type GroupOutletContext = {
    group: Group;
    getGroup: () => Promise<void>;
};

export type ObjectContextValues = {
    object?: Partial<ObjectOrConfigOrBlobData>;
    objectError: unknown;
    objectType: ObjectType;
    searchEndpoint: string;
    setObjectError: (error: unknown) => void;
    updateObject: (doLoad?: boolean) => void;
    updateObjectData: (object: Partial<ObjectOrConfigOrBlobData>) => void;
};
