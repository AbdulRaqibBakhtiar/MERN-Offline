import React, { useState } from 'react';
import { getAvatarUrl } from '../../utils/avatar';

const getDisplayName = person => {
  if (typeof person === 'string') return person;
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.username || person?.name || 'User';
};

export default function UserAvatar({ person, className = '', alt, title }) {
  const displayName = getDisplayName(person);
  const imageUrl = getAvatarUrl(person?.profileImage || person?.avatar);
  const [imageFailed, setImageFailed] = useState(false);
  return <span className={`user-avatar ${className}`.trim()} title={title || displayName} aria-label={alt || displayName}>
    {imageUrl && !imageFailed ? <img src={imageUrl} alt={alt || `${displayName} profile`} loading="lazy" onError={() => setImageFailed(true)} /> : <span aria-hidden="true">{displayName.trim().charAt(0).toUpperCase() || 'U'}</span>}
  </span>;
}
