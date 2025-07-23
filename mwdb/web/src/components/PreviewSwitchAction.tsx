import { ObjectAction, useTabContext } from "./ShowObject";
import { useState } from "react";
import { NavDropdown } from "@mwdb-web/commons/ui";

const modes = ["raw", "text", "hex"] as const;
type Mode = (typeof modes)[number];

export function PreviewSwitchAction() {
    const tabContext = useTabContext();
    const [currentMode, setCurrentMode] = useState<Mode>("raw");

    return (
        <NavDropdown
            title="Mode"
            elements={modes.map((mode) => {
                const selected = currentMode === mode;

                const selectedStyle = {
                    fontWeight: selected ? "bold" : "normal",
                    pointerEvents: (selected ? "none" : "auto") as
                        | "none"
                        | "auto",
                };

                return (
                    <span className="nav-item" style={selectedStyle} key={mode}>
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
