import { api } from "@mwdb-web/commons/api";
import { Capability, ServerInfo, User } from "./types";

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
    hasCapability: (cap: Capability) => boolean;
    refreshSession: () => Promise<void>;
    updateSession: (newSession: User) => void;
    logout: (error?: string) => void;
    oAuthLogout: () => Promise<any>;
};

export type ApiContextValues = typeof api & {
    remote?: string;
};

export type ProfileOutletContext = {
    getUser: () => Promise<void>;
    setCapabilitiesToDelete: (cap: Capability) => void;
    profile: User;
};
