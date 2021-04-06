import React, { useCallback, useContext, useEffect, useState } from "react";

import { faCopy, faChevronUp, faChevronDown, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import {AuthContext} from "@mwdb-web/commons/auth";

export default function AccountAPIKeys() {
    const auth = useContext(AuthContext);
    const [apiKeys, setApiKeys] = useState(null);
    const [apiToken, setApiToken] = useState({});

    async function getApiToken(apiKeyId) {
        try {

        } catch(error) {

        }
    }

    async function removeApiKey(apiKeyId) {
        try {

        } catch(error) {

        }
    }

    return (
        <div>
            <h5>API keys</h5>
            <div className="card">
                <div className="card-body">
                    <h5 className="card-subtitle text-muted">
                        API key <span className="text-monospace">2222-222-222</span>
                    </h5>
                    <p className="card-text">
                        Issued on: xxxx
                    </p>
                    <a href="#" className="card-link">
                        <FontAwesomeIcon icon={faChevronDown}/>{" "}
                        Show token
                    </a>
                    <a href="#" className="card-link text-danger">
                        <FontAwesomeIcon icon={faTrash}/>{" "}
                        Remove key
                    </a>
                    <div className="card card-body border-primary">
                        <div className="text-monospace" style={{margin: "8pt 0"}}>
                        eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbiI6InBzcm9rMSIsImFwaV9rZXlfaWQiOdsadasdadasdasdasg3453453453453fdgdfgdfgdf98g7df89g7df9g6dfg89df67g98df6g7df8g6df8g6df8gdf6g78df6d87g5df687g5df76g5df7gdf5gf67g5df7gg67fd57g
                        </div>
                        <a href="#" className="card-link">
                            <FontAwesomeIcon icon={faCopy}/>{" "}
                            Copy to clipboard
                        </a>
                    </div>
                </div>
            </div>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <a href="#" className="nav-link">
                        <FontAwesomeIcon icon={faPlus}/>{" "}
                        Issue new API key
                    </a>
                </li>
            </ul>
        </div>
    )
}