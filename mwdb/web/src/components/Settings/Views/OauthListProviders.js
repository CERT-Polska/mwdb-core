import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { APIContext } from "@mwdb-web/commons/api/context";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useViewAlert } from "@mwdb-web/commons/ui";

export default function OAuthListProviders() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [providers, setProviders] = useState([]);

    async function getProviders() {
        try {
            const response = await api.oauthGetProviders();
            setProviders(response.data["providers"]);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    useEffect(() => {
        getProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container">
            <h2>OpenID Connect identity providers</h2>
            <p className="lead">
                Here are the list of registered external identity providers:
            </p>
            {providers.length ? (
                <React.Fragment>
                    {providers.map((provider) => (
                        <Link
                            key={provider}
                            to={`/settings/oauth/${provider}`}
                            className="card btn-outline-secondary text-decoration-none"
                        >
                            <div className="card-body">
                                <h5>
                                    <span className="text-monospace list-inline-item">
                                        {provider}
                                    </span>
                                </h5>
                            </div>
                        </Link>
                    ))}
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <p className="font-weight-bold">
                        There is no registered identity provider.
                    </p>
                </React.Fragment>
            )}
            <div>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <Link
                            to="/settings/oauth/register"
                            className="nav-link"
                        >
                            <FontAwesomeIcon icon={faPlus} /> Register new
                            external identity provider
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
