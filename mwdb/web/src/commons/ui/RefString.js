import React, {Component} from 'react';
import ObjectLink from './ObjectLink';

class RefString extends Component {
    render() {
        const reasonText = this.props.reason_type.charAt(0).toUpperCase() + this.props.reason_type.slice(1).toLowerCase();
        const objLink = (
            this.props.related_object_dhash
            ? <ObjectLink type={this.props.related_object_type} id={this.props.related_object_dhash} inline/>
            : <span className="text-muted">(object deleted)</span>
        );
        const userLink = <ObjectLink type="user" id={this.props.related_user_login} />;

        return <div>
            {reasonText} {objLink} by {userLink}
        </div>
    }
}

export default RefString;