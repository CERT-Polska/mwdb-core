import React from "react";
import { Link } from "react-router-dom";
import ObjectLink from "./ObjectLink";
import { makeSearchLink } from "../helpers";

export default function RefString(props) {
    const reasonText =
        props.reason_type.charAt(0).toUpperCase() +
        props.reason_type.slice(1).toLowerCase();
    const objLink = props.related_object_dhash ? (
        <ObjectLink
            type={props.related_object_type}
            id={props.related_object_dhash}
            inline
        />
    ) : (
        <span className="text-muted">(object deleted)</span>
    );
    const userLink = (
        <Link to={makeSearchLink("uploader", props.related_user_login)}>
            {props.related_user_login}
        </Link>
    );

    return (
        <div>
            {reasonText} {objLink} by {userLink}
        </div>
    );
}

// class RefString extends Component {
//     render() {
//         const reasonText =
//             this.props.reason_type.charAt(0).toUpperCase() +
//             this.props.reason_type.slice(1).toLowerCase();
//         const objLink = this.props.related_object_dhash ? (
//             <ObjectLink
//                 type={this.props.related_object_type}
//                 id={this.props.related_object_dhash}
//                 inline
//             />
//         ) : (
//             <span className="text-muted">(object deleted)</span>
//         );
//         const userLink = (
//             <Link
//                 to={makeSearchLink("uploader", this.props.related_user_login)}
//             >
//                 {this.props.related_user_login}
//             </Link>
//         );
//
//         return (
//             <div>
//                 {reasonText} {objLink} by {userLink}
//             </div>
//         );
//     }
// }
//
// export default RefString;
