import { KartonAnalysis } from "@mwdb-web/types/types";
import { KartonAnalysisRow } from "../common/KartonAnalysisRow";

type Props = {
    analyses: KartonAnalysis[];
    handleRemoveAnalysis: (id: number) => void;
};

export function KartonAnalysisList({ analyses, handleRemoveAnalysis }: Props) {
    if (!analyses) {
        return <div className="card-body text-muted">Loading data...</div>;
    }
    if (analyses.length === 0) {
        return (
            <div className="card-body text-muted">
                Object was never analyzed by Karton
            </div>
        );
    }
    return (
        <table className="table table-striped table-bordered wrap-table">
            {analyses
                .slice()
                .reverse()
                .map((analysis) => (
                    <tr key={analysis.id}>
                        <td>
                            <KartonAnalysisRow
                                analysis={analysis}
                                removeAnalysis={handleRemoveAnalysis}
                            />
                        </td>
                    </tr>
                ))}
        </table>
    );
}
