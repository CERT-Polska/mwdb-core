import { KartonAnalysis } from "@mwdb-web/types/types";
import { KartonAnalysisRow } from "../common/KartonAnalysisRow";

type Props = {
    analyses: KartonAnalysis[];
    handleRemoveAnalysis: (id: string) => void;
    loadMore: (() => Promise<void>) | null;
};

export function KartonAnalysisList({
    analyses,
    handleRemoveAnalysis,
    loadMore,
}: Props) {
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
            {analyses.slice().map((analysis) => (
                <tr key={analysis.id}>
                    <td>
                        <KartonAnalysisRow
                            analysis={analysis}
                            removeAnalysis={handleRemoveAnalysis}
                        />
                    </td>
                </tr>
            ))}
            {loadMore ? (
                <tr key="loadMore">
                    <td>
                        <button
                            className="btn btn-link"
                            onClick={() => loadMore()}
                        >
                            Load more...
                        </button>
                    </td>
                </tr>
            ) : (
                []
            )}
        </table>
    );
}
