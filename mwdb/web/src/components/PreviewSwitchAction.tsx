import { ObjectAction, useTabContext } from "./ShowObject";
import { NavDropdown } from "@mwdb-web/commons/ui";

const modes = ["raw", "hex", "strings", "widechar"] as const;
type Mode = (typeof modes)[number];

const isMode = (v: unknown): v is Mode =>
    typeof v === "string" && (modes as readonly string[]).includes(v);

export function PreviewSwitchAction() {
    const tabContext = useTabContext();
    const currentMode: Mode = isMode(tabContext.subTab)
        ? tabContext.subTab
        : "raw";

    return (
        <NavDropdown
            title="Mode"
            elements={modes.map((mode) => {
                const navItem = currentMode === mode;

                const navItemStyle = {
                    fontWeight: navItem ? "bold" : "normal",
                };

                return (
                    <span className="nav-item" style={navItemStyle} key={mode}>
                        <ObjectAction
                            label={mode}
                            link={tabContext.getTabLink(
                                tabContext.tab ?? "",
                                mode
                            )}
                        />
                    </span>
                );
            })}
        />
    );
}
