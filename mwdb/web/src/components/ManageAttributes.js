import React, { Component } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { PagedList, View } from "@mwdb-web/commons/ui";

class ManageAttributes extends Component {
    state = {
        metakeys: [],
        activePage: 1,
        keyFilter: "",
    };

    handlePageChange = (pageNumber) => {
        this.setState({ activePage: pageNumber });
    };

    handleFilterChange = (ev) => {
        const target = ev.target;
        this.setState({ keyFilter: target.value, activePage: 1 });
    };

    async componentDidMount() {
        this.setState({ keyFilter: "", activePage: 1 });
        try {
            let response = await api.getMetakeyDefinitions();
            this.setState({
                metakeys: response.data.metakeys,
            });
        } catch (error) {
            this.setState({ error });
        }
    }

    get items() {
        return this.state.metakeys.map((m) => ({
            name: m.key,
            label: m.label,
            template: m.template,
            description: m.description,
        }));
    }

    render() {
        return (
            <View fluid error={this.state.error}>
                <Link to="/attributes/new">
                    <button type="button" className="btn btn-success">
                        Define attribute
                    </button>
                </Link>
                <PagedList
                    listItem={MetakeyItem}
                    columnNames={["Key (Label)", "Description", "URL Template"]}
                    items={this.items.slice(
                        (this.state.activePage - 1) * 10,
                        this.state.activePage * 10
                    )}
                    itemCount={this.items.length}
                    activePage={this.state.activePage}
                    filterValue={this.state.keyFilter}
                    onPageChange={this.handlePageChange}
                    onFilterChange={this.handleFilterChange}
                />
            </View>
        );
    }
}

class MetakeyItem extends Component {
    render() {
        return (
            <tr>
                <td style={{ textAlign: "left" }}>
                    <Link to={`/attribute/${this.props.name}`}>
                        {this.props.name}
                    </Link>
                    &nbsp;
                    {this.props.label && <span>({this.props.label})</span>}
                </td>
                <td>
                    {this.props.description || (
                        <div style={{ color: "gray" }}>(Not defined)</div>
                    )}
                </td>
                <td>
                    {this.props.template || (
                        <div style={{ color: "gray" }}>(Not defined)</div>
                    )}
                </td>
            </tr>
        );
    }
}

export default ManageAttributes;
