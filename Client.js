import React from "react";
import PropTypes from "prop-types";
import Avatar from "react-avatar";

function Client({ username }) {
  if (!username) {
    return <div className="d-flex align-items-center mb-3">Unknown User</div>; // Display "Unknown User" if username is undefined
  }

  return (
    <div className="d-flex align-items-center mb-3">
      <Avatar
        name={username.toString()}
        size={50}
        round="14px"
        className="mr-3"
      />
      <span className="mx-2">{username.toString()}</span>
    </div>
  );
}

Client.propTypes = {
  username: PropTypes.string,
};

export default Client;
