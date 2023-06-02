import { useContext } from "react";

import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

import logo from "../../assets/logo.png";

export function AboutView() {
    const config = useContext(ConfigContext);

    return (
        <div className="align-items-center">
            <div
                className="jumbotron d-flex align-items-center"
                style={{ backgroundColor: "#101c28", color: "white" }}
            >
                <View ident="about">
                    <div className="row justify-content-center">
                        <div className="col-lg-2 col-sm-4 offset-2 text-center">
                            <img src={logo} alt="logo" className="logo-about" />
                        </div>
                        <div className="col-lg-6 col-sm-4">
                            <h1>mwdb-core</h1>
                            <p>
                                Powered by <a href="https://cert.pl">CERT.pl</a>
                                <br />
                                Version:{" "}
                                <a
                                    href={
                                        "https://github.com/CERT-Polska/mwdb-core/releases/tag/v" +
                                        config.config.server_version
                                    }
                                >
                                    {config.config.server_version}
                                </a>
                                <br />
                                Try out our{" "}
                                <a
                                    href="https://pypi.org/project/mwdblib/"
                                    style={{ color: "hsla(0,0%,100%,.5)" }}
                                >
                                    mwdblib library
                                </a>
                                !
                            </p>
                        </div>
                    </div>
                </View>
            </div>
        </div>
    );
}
