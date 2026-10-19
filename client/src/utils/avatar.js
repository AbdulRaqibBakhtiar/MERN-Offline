import { API_BASE_URL } from '../api/config';
// utils/avatar.js

export const getAvatarUrl = (profileImage) => {
    if (typeof profileImage !== 'string' || !profileImage.trim()) return null;
    const image = profileImage.trim();

    if (
        /^(https?:|data:|blob:)/i.test(image)
    ) {
        return image;
    }

    return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
};
