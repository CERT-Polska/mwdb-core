import { useState } from "react";

type Props = {
    submitComment: (text: string) => void;
};

export function CommentForm(props: Props) {
    const [text, setText] = useState<string>("");

    function submitForm() {
        props.submitComment(text);
        setText("");
    }

    return (
        <form
            className="commentForm"
            onSubmit={(ev) => {
                ev.preventDefault();
                submitForm();
            }}
        >
            <div className="input-group">
                <textarea
                    className="form-control"
                    placeholder="Say something..."
                    value={text}
                    onChange={(ev) => setText(ev.target.value)}
                    onKeyDown={(evt) =>
                        evt.ctrlKey && evt.keyCode === 13 && submitForm()
                    }
                />
                <div className="input-group-append">
                    <input
                        className="btn btn-outline-primary"
                        type="submit"
                        value="Post"
                    />
                </div>
            </div>
            <div className="form-hint">Press Ctrl+Enter to send comment</div>
        </form>
    );
}
