import React from "react";

function UserProfile({ user, handleLogout }) {
    return (
        <div className="user-card">
    <h2>User Profile</h2>
    <div className="avatar">
        {user?.username?.charAt(0).toUpperCase()}
    </div>

    <p><strong>Username</strong></p>
    <p>{user?.username}</p>

    <p><strong>User ID</strong></p>
    <small>{user?.id}</small>

    {user?.createdAt && (
        <>
            <p><strong>Member Since</strong></p>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </>
    )}

    <button
        onClick={handleLogout}
        className="cancel-button"
    >
        Logout
    </button>
</div>
    );
}
export default UserProfile;
