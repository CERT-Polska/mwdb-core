import { useContext } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { ConfigContext } from "@mwdb-web/commons/config";
import { ShowIf } from "@mwdb-web/commons/ui";

type Props<T extends FieldValues> = {
    sharingKey: Path<T>;
    register: UseFormRegister<T>;
};

export function Sharing<T extends FieldValues>({
    register,
    sharingKey,
}: Props<T>) {
    const config = useContext(ConfigContext);
    return (
        <ShowIf
            condition={!config.config["is_3rd_party_sharing_consent_enabled"]}
        >
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <label className="input-group-text">
                        Share with 3rd party services
                    </label>
                </div>
                <div
                    className="input-group-append form-control"
                    style={{
                        alignItems: "center",
                        height: "32pt",
                    }}
                >
                    <div className="material-switch make-horizontal">
                        <input
                            id={sharingKey}
                            {...register(sharingKey)}
                            type="checkbox"
                        />
                        <label htmlFor={sharingKey} className="bg-primary" />
                    </div>
                </div>
                <div className="form-hint">
                    Object can be shared automatically with 3rd party services
                </div>
            </div>
        </ShowIf>
    );
}
