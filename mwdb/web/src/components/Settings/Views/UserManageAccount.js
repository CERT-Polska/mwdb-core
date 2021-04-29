import React, { useState, useEffect } from "react";
import api from "@mwdb-web/commons/api";
import UserItem from "./UserItem";

export default function UserManageAccount({ user, updateUser }) {
    const [email, setEmail] = useState(user.email);
    const [additional_info, setAdditional_info] = useState(
        user.additional_info
    );
    const [feed_quality, setFeed_quality] = useState(user.feed_quality);
    const [disabled, setDisabled] = useState(user.disabled);

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            await api.updateUser(
                user.login,
                email,
                additional_info,
                feed_quality
            );
            //set success
        } catch (error) {
            console.log(error);
        } finally {
            updateUser();
        }
    }

    async function handleBlockUser(event, block) {
        event.preventDefault();
        try {
            await api.setUserDisabled(user.login, block);
            //set success
        } catch (error) {
            console.log(error);
        } finally {
            updateUser();
        }
    }

    useEffect(() => {
        setEmail(user.email);
        setAdditional_info(user.additional_info);
        setFeed_quality(user.feed_quality);
        setDisabled(user.disabled);
    }, [user]);

    if (Object.keys(user).length === 0) return [];

    return (
        <div className="container">
            <h4>Manage {user.login} account</h4>
            <form onSubmit={handleSubmit}>
                <table className="table table-striped table-bordered wrap-table">
                    <tbody>
                        <UserItem label="E-mail">
                            <input
                                type="text"
                                name="email"
                                value={email}
                                onChange={(ev) => setEmail(ev.target.value)}
                                className="form-control"
                                required
                            />
                        </UserItem>
                        <UserItem label="Additional info">
                            {" "}
                            <input
                                type="text"
                                name="additional_info"
                                value={additional_info}
                                onChange={(ev) =>
                                    setAdditional_info(ev.target.value)
                                }
                                className="form-control"
                                required
                            />
                        </UserItem>
                        <UserItem label="Feed quality">
                            <select
                                value={feed_quality}
                                name="feed_quality"
                                onChange={(ev) =>
                                    setFeed_quality(ev.target.value)
                                }
                                className="form-control"
                            >
                                <option value="high">high</option>
                                <option value="low">low</option>
                            </select>
                        </UserItem>
                    </tbody>
                </table>
                <div className="btn-group" role="group">
                    <input
                        type="submit"
                        value="Submit"
                        className="btn btn-primary"
                    />
                </div>
                {disabled ? (
                    <button
                        onClick={(event) => handleBlockUser(event, false)}
                        type="button"
                        className="btn btn-success align-right"
                    >
                        Unblock
                    </button>
                ) : (
                    <button
                        onClick={(event) => handleBlockUser(event, true)}
                        type="button"
                        className="btn btn-danger align-right"
                    >
                        Block
                    </button>
                )}
            </form>
        </div>
    );
}
