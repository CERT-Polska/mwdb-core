import { useContext, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/plugins";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { KartonAnalysisList } from "./KartonAnalysisList";
import { Capability } from "@mwdb-web/types/types";

export function KartonAnalysisBox() {
    const [isResubmitPending, setResubmitPending] = useState<boolean>(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [analysisToRemove, setAnalysisToRemove] = useState<number | null>(
        null
    );

    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const { object, setObjectError, updateObjectData } =
        useContext(ObjectContext);
    const objectId = object!.id;
    const analyses = object!.analyses;
    const isReanalysisAvailable = auth.hasCapability(
        Capability.kartonReanalyze
    );

    async function updateAnalyses() {
        try {
            if (objectId) {
                let response = await api.getKartonAnalysesList(objectId);
                updateObjectData({
                    analyses: response.data.analyses,
                });
            }
        } catch (error) {
            setObjectError(error);
        }
    }

    const getAnalyses = useCallback(updateAnalyses, [
        api,
        objectId,
        setObjectError,
        updateObjectData,
    ]);

    useEffect(() => {
        getAnalyses();
        const updateInterval = setInterval(() => {
            getAnalyses();
        }, 10000);
        return () => {
            clearInterval(updateInterval);
        };
    }, [getAnalyses]);

    async function submitAnalysis(ev: React.MouseEvent) {
        ev.preventDefault();
        setResubmitPending(true);
        try {
            if (objectId) {
                await api.resubmitKartonAnalysis(objectId);
                await updateAnalyses();
            }
        } catch (error) {
            setObjectError(error);
        }
    }

    async function removeAnalysis(analysisId: number) {
        try {
            if (objectId) {
                await api.removeKartonAnalysisFromObject(objectId, analysisId);
                await updateAnalyses();
            }
        } catch (error) {
            setObjectError(error);
        } finally {
            setDeleteModalOpen(false);
        }
    }

    function handleRemoveAnalysis(analysisId: number) {
        setAnalysisToRemove(analysisId);
        setDeleteModalOpen(true);
    }

    return (
        <Extendable ident="kartonAnalysisBox">
            <div className="card card-default">
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onRequestClose={() => setDeleteModalOpen(false)}
                    onConfirm={() => {
                        analysisToRemove
                            ? removeAnalysis(analysisToRemove)
                            : () => {};
                    }}
                    message="Remove the analysis from object?"
                    confirmText="Remove"
                />

                <div className="card-header">
                    Karton analyses
                    <Link
                        to="#"
                        onClick={submitAnalysis}
                        className={["float-right"]
                            .concat(
                                isReanalysisAvailable && !isResubmitPending
                                    ? []
                                    : ["text-muted"]
                            )
                            .join(" ")}
                    >
                        <FontAwesomeIcon icon={faPlus} pull="left" />
                        Reanalyze
                    </Link>
                </div>
                <KartonAnalysisList
                    analyses={analyses ?? []}
                    handleRemoveAnalysis={handleRemoveAnalysis}
                />
            </div>
        </Extendable>
    );
}
