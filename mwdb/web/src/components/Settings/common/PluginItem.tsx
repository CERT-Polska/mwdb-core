import { ActivePlugin } from "@mwdb-web/types/types";

type Props = {
    name: string;
    info: ActivePlugin;
};

export function PluginItems(props: Props) {
    const { name, info } = props;
    const { active, version, description } = info;

    return (
        <tr>
            <td>
                {name}{" "}
                {active ? (
                    <span className="badge badge-success">Active</span>
                ) : (
                    <span className="badge badge-danger">Inactive</span>
                )}
            </td>
            <td>{description}</td>
            <td>{version}</td>
        </tr>
    );
}
