import { useContext, useState } from "react";

import { Capability, ObjectData } from "@mwdb-web/types/types";
import { QueryResultContext } from "../common/QueryResultContext";
import { APIContext } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { AuthContext } from "@mwdb-web/commons/auth";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { ResultOptionItem } from "../common/ResultOptionItem";

export function KartonReanalyzeAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const { items } = useContext(QueryResultContext);

    const { setAlert } = useViewAlert();

    const [modalOpen, setIsModalOpen] = useState<boolean>(false);


    function kartonReanalyze() {
        items.forEach(async (e: ObjectData) => {
            await api.resubmitKartonAnalysis(e.id)
                .catch((err) => setAlert({
                        error: `Error submitting reanalysis for object ${e.id}: ${err}` 
                }));
        });
        setIsModalOpen(false);
    }

    return (
            <ResultOptionItem
                key={"kartonReanalyzeOption"}
                title={"Karton Reanalysis"}
                action={() => setIsModalOpen(true)}
                authenticated={() => auth.hasCapability(Capability.kartonReanalyze)}
            >
                <ConfirmationModal
                    isOpen={modalOpen}
                    message="Are you sure you want to reanalyze?"
                    onRequestClose={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                    onConfirm={kartonReanalyze}
                />
            </ResultOptionItem>
);
}
