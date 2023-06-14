import { ObjectAction, useTabContext } from "./ShowObject";

export function PreviewSwitchAction() {
    const tabContext = useTabContext();
    const mode = tabContext.subTab || "raw";

    if (mode === "raw") {
        return (
            <ObjectAction
                label="Hex view"
                link={tabContext.getTabLink(tabContext.tab ?? "", "hex")}
            />
        );
    }
    return (
        <ObjectAction
            label="Raw view"
            link={tabContext.getTabLink(tabContext.tab ?? "", "raw")}
        />
    );
}
