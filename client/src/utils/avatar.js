// utils/avatar.js

export const getAvatarUrl = (profileImage) => {
    if (!profileImage) return null;

    if (
        profileImage.startsWith("http://") ||
        profileImage.startsWith("https://") ||
        profileImage.startsWith("data:")
    ) {
        return profileImage;
    }

    return `http://localhost:5000${profileImage}`;
};