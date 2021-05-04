import React from "react";

import { capabilitiesList } from "../auth";
import BootstrapSelect from "./BootstrapSelect";

export default function CapabilitiesSelect() {
    return (
        <BootstrapSelect data-multiple-separator={""} data-live-search="true"
                         data-none-selected-text={"No capabilities enabled"}
                         className={"form-control"} multiple onChange={(e, clickedIndex, isSelected, previousValue) => {
            console.log(clickedIndex, isSelected, previousValue)
        }}>
            {
                Object.keys(capabilitiesList).map((cap) => (
                    <option data-content={`<span class='badge badge-success'>${cap}</span>`}>
                        {cap}
                    </option>
                ))
            }
        </BootstrapSelect>
    )
}