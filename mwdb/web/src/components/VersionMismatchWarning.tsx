type VersionMismatchWarningProps = {
    serverVersion?: string;
    clientVersion: string;
};

export function VersionMismatchWarning({
    serverVersion,
    clientVersion,
}: VersionMismatchWarningProps) {
    if (!serverVersion || clientVersion == serverVersion) return <></>;
    return (
        <div className="alert alert-warning" role="alert">
            Server version was recently updated to {serverVersion} while
            currently loaded web application is {clientVersion}. Press
            CTRL+F5 to clear cache and reload the webpage.
        </div>
    );
}
