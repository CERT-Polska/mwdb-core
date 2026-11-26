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

export type ApiContextValues = typeof api;

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
    openidProviders: string[];
};

export type ObjectContextValues = {
    object?: Partial<ObjectOrConfigOrBlobData>;
    objectType: ObjectType;
    searchEndpoint: string;
    setObjectError: (error: unknown) => void;
    updateObject: (doLoad?: boolean) => void;
    updateObjectData: (object: Partial<ObjectOrConfigOrBlobData>) => void;
};
