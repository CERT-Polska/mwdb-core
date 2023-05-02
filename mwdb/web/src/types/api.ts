import { AxiosResponse } from "axios";
import { BlobData, ConfigData, Group, ObjectData, User } from "./types";

export type Response<T, C = any> = Promise<AxiosResponse<T, C>>;

export type ServerInfoResponse = Response<{ status: string }>;

type ServerDocsInfo = {
    description: string;
    title: string;
    version: string;
};

type ServerDocsServer = {
    url: string;
    description: string;
};

export type ServerDocsResponse = Response<{
    components: object;
    info: ServerDocsInfo;
    paths: object;
    servers: ServerDocsServer[];
}>;

export type ServerAdminInfoResponse = Response<{
    active_plugins: object;
    plugins_enabled: boolean;
    rate_limit_enabled: boolean;
}>;

export type AuthLoginResponse = Response<User>;

export type AuthRefreshResponse = Response<User>;

export type AuthSetPasswordResponse = Response<{
    login: string;
}>;

export type AuthRequestPasswordChangeResponse = Response<{
    login: string;
}>;

export type AuthRecoverPasswordResponse = Response<{
    login: string;
}>;

export type AuthGrupsResponse = Response<Group>;

export type ApiKeyAddResponse = Response<{
    issuer_login: string;
    name: string;
    id: string;
    token: string;
    issued_on: string | Date;
}>;

export type ApiKeyRemoveResponse = Response<null>;

export type GetObjectResponse = Response<ObjectData | ConfigData | BlobData>;
