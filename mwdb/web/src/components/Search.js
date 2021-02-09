import React, { Component } from "react";

import RecentObjects from "./RecentObjects";
import { View } from "@mwdb-web/commons/ui";

export default (props) => <RecentObjects disallowEmpty {...props} />;

export class SearchHelp extends Component {
    render() {
        return (
            <View fluid>
                <div className="jumbotron">
                    <div className="accordion">
                        <a
                            className="lead"
                            data-toggle="collapse"
                            href="#examples"
                        >
                            Examples
                        </a>
                        <hr className="my-4" />
                        <div id="examples" className="collapse show">
                            <ul>
                                <li>
                                    <kbd>file.name:Faktura_*.vbs</kbd>{" "}
                                    <kbd>
                                        file.type:data AND file.size:[5000 TO
                                        5500]
                                    </kbd>
                                </li>
                                <li>
                                    <kbd>
                                        tag:*danabot* OR comment:*danabot*
                                    </kbd>
                                </li>
                                <li>
                                    <kbd>file.type:PE32*</kbd>{" "}
                                    <kbd>
                                        file.type:"Zip archive data, at least
                                        v?.? to extract"
                                    </kbd>
                                </li>
                                <li>
                                    <kbd>
                                        upload_time:[2018-02-09 TO 2018-10-10]
                                    </kbd>
                                </li>
                                <li>
                                    <kbd>static.cfg.rc4_key:fenquyidh</kbd>
                                </li>
                                <li>
                                    <kbd>
                                        static.cfg.public_key.t:ecdsa_pub_p384
                                    </kbd>
                                </li>
                                <li>
                                    <kbd>static.cfg.cnc:"122.123.*.*"</kbd>
                                </li>
                            </ul>
                        </div>
                        <a
                            className="lead"
                            data-toggle="collapse"
                            href="#how-to-query"
                        >
                            How to query?
                        </a>
                        <hr className="my-4" />
                        <div id="how-to-query" className="collapse show">
                            <p>
                                Syntax used in all queries follows{" "}
                                <a href="http://www.lucenetutorial.com/lucene-query-syntax.html">
                                    lucene syntax
                                </a>
                                . Supported features:
                            </p>
                            <ul>
                                <li>
                                    Search fields -{" "}
                                    <kbd>file.name:something.exe</kbd>
                                </li>
                                <li>
                                    Boolean operators and grouping(
                                    <kbd>AND</kbd>, <kbd>OR</kbd>,{" "}
                                    <kbd>NOT</kbd>) -{" "}
                                    <kbd>
                                        tag:danabot AND
                                        file.md5:e49533942dd1b8d28193b36960cfcec6
                                    </kbd>{" "}
                                    <kbd>
                                        tag:danabot AND (file.type:data OR
                                        file.sha256:752163e8b2d0df7480aa38aeba146e96686655efd15bbd3351b7338544c50738)
                                    </kbd>
                                </li>
                                <li>
                                    Wildcards matching(<kbd>*</kbd> - many,{" "}
                                    <kbd>?</kbd> - single) -{" "}
                                    <kbd>file.type:PE32*</kbd>{" "}
                                    <kbd>
                                        file.type:"Zip archive data, at least
                                        v?.? to extract"
                                    </kbd>
                                </li>
                                <li>
                                    Range searches(<kbd>[x TO y]</kbd>,{" "}
                                    <kbd>{"{}"}</kbd> for inclusive) -{" "}
                                    <kbd>file.size:[0 TO 5000]</kbd>{" "}
                                    <kbd>
                                        file.size:{"{"}0 TO 5000{"}"}
                                    </kbd>
                                </li>
                            </ul>
                        </div>
                        <a
                            className="lead"
                            data-toggle="collapse"
                            href="#what-to-query"
                        >
                            What to query?
                        </a>
                        <hr className="my-4" />
                        <div id="what-to-query" className="collapse show">
                            <p>Supported list of fields:</p>
                            <ul>
                                <li>file.name</li>
                                <li>file.size</li>
                                <li>file.type</li>
                                <li>file.md5</li>
                                <li>file.crc32</li>
                                <li>file.sha1</li>
                                <li>file.sha256</li>
                                <li>file.sha512</li>
                                <li>file.ssdeep</li>
                                <li>static.family</li>
                            </ul>
                            Common fields:
                            <ul>
                                <li>upload_time</li>
                                <li>comment</li>
                                <li>tag</li>
                            </ul>
                            <p>
                                You can't query multiple types of objects at
                                once, eg: file and static
                            </p>
                        </div>
                        <a
                            className="lead"
                            data-toggle="collapse"
                            href="#querying-configs"
                        >
                            Querying configs
                        </a>
                        <hr className="my-4" />
                        <div id="querying-configs" className="collapse show">
                            <p>
                                JSONs in configs can be queried using following
                                syntax:
                            </p>
                            <ul>
                                <li>static.cfg.field_1.field_2:value</li>
                            </ul>

                            <p>Which would find configs of structure below:</p>
                            <pre>
                                {"{"}"field_1":
                                {"{"}"field_2": value
                                {"}}"}
                            </pre>
                            <p>
                                For more information check out{" "}
                                <a href="#examples">examples</a>
                            </p>
                        </div>
                    </div>
                </div>
            </View>
        );
    }
}
