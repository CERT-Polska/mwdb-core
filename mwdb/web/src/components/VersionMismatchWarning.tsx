type VersionMismatchWarningProps = {
    serverVersion?: string;
    clientVersion: string;
};

function stripVersionTag(version: string): string {
    // Strips possible version tag with Git revision
    // e.g. 2.0.0-rc1+6b2f1c1a is converted to 2.0.0-rc1
    return version.split("+")[0];
}

export function VersionMismatchWarning({
    serverVersion,
    clientVersion,
}: VersionMismatchWarningProps) {
    if (
        !serverVersion ||
        stripVersionTag(clientVersion) === stripVersionTag(serverVersion)
    )
        return <></>;
    return (
        <div className="alert alert-warning" role="alert">
            Server version was recently updated to {serverVersion} while
            currently loaded web application is {clientVersion}. Press CTRL+F5
            to clear cache and reload the webpage.
        </div>
    );
}
