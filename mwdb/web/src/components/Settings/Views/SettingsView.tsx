import { Outlet } from "react-router-dom";

import { View } from "@mwdb-web/commons/ui";
import { SettingsNav } from "../common/SettingsNav";

export function SettingsView() {
    return (
        <View ident="settings" fluid>
            <div className="row">
                <div className="col-sm-2">
                    <SettingsNav />
                </div>
                <div className="col-sm-8">
                    <div className="tab-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </View>
    );
}
