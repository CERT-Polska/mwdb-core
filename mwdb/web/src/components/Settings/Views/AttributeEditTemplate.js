import React from "react";

export function AttributeEditTemplate({attribute, getAttribute}) {
    return (
        <div className="container">
            <p>
                Rich templates combine forces of{" "}
                <a href="https://mustache.github.io/mustache.5.html">Mustache</a> and{" "}
                <a href="https://www.markdownguide.org/basic-syntax/">Markdown</a>{" "}
                languages to give you next level of flexibility in rendering attribute values in UI without the
                need of writing additional plugins. Templates allow you to render value objects as custom links, lists, tables or
                combinations of them.
                You can also combine your representation with other context values like sample name or hash.
            </p>
        </div>
    )
}