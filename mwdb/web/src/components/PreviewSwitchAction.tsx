import { ObjectAction, useTabContext } from "./ShowObject";
import { useState } from "react";
import { NavDropdown } from "@mwdb-web/commons/ui";

const modes = ["raw", "hex", "strings", "widechar"] as const;
type Mode = (typeof modes)[number];

export function PreviewSwitchAction() {
    const tabContext = useTabContext();
    const [currentMode, setCurrentMode] = useState<Mode>("raw");

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
                            action={() => setCurrentMode(mode)}
                        />
                    </span>
                );
            })}
        />
    );
}
