const nodeStatuses = {
    initial: "initial",
    showGraph: "showGraph",
    showWarning: "showWarning",
};

type Props = {
    setNodesStatus: (graph: string) => void;
    nodesLength: number;
};

export function RelationToManyNode({ setNodesStatus, nodesLength }: Props) {
    return (
        <>
            <div
                className="alert alert-warning"
                style={{ margin: "10px 20px", fontSize: 18 }}
            >
                The relationships for a given object will amount to{" "}
                <span className="font-weight-bold">{nodesLength}</span>{" "}
                elements, displaying such a quantity of connections may affect
                the application's performance.
            </div>
            <div className="text-center mb-2">
                <button
                    className="btn btn-warning"
                    onClick={() => setNodesStatus(nodeStatuses.showGraph)}
                >
                    Show relations anyway
                </button>
            </div>
        </>
    );
}
