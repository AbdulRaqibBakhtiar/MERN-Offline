import React from 'react';
import { Download, FileText, FolderArchive } from 'lucide-react';

export const MessageFileDownload = ({ attachmentUrl, isMe, msg }) => {
  // 🎯 Fix 1: Pull the true original name from attachmentType (e.g., "report.docx" or "archive.rar")
  const originalName = msg?.attachmentType || "Shared_File";
  
  // Extract file extension safely from the true name field
  let fileExtension = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : '';

  // Extract display label from url string hashes
  const urlSlug = attachmentUrl ? attachmentUrl.substring(attachmentUrl.lastIndexOf('/') + 1) : "Document_Asset";
  
  // 🎯 Fix 2: Smart fallback heuristic if the extension is completely missing from database strings
  if (!fileExtension && msg?.name) {
    const checkName = msg.name.toLowerCase();
    if (checkName.includes('zip') || checkName.includes('rar') || checkName.includes('7z')) fileExtension = 'rar';
    else if (checkName.includes('pdf')) fileExtension = 'pdf';
    else if (checkName.includes('doc') || checkName.includes('docx')) fileExtension = 'docx';
    else if (checkName.includes('xls') || checkName.includes('xlsx')) fileExtension = 'xlsx';
  }

  // Fallback display label logic
  const displayExtension = fileExtension ? `.${fileExtension}` : '';
  const cleanLabel = urlSlug.length > 20 ? `${urlSlug.substring(0, 16)}...${displayExtension}` : `${urlSlug}${displayExtension}`;

  // 🎯 High-Fidelity WhatsApp Style Color Profiles Matrix Map
  const getFileBadgeSettings = (ext) => {
    switch (ext) {
      case 'pdf':
        return { label: 'PDF', bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
      case 'doc':
      case 'docx':
        return { label: 'WORD', bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' };
      case 'xls':
      case 'xlsx':
        return { label: 'EXCEL', bg: '#dcfce7', text: '#16a34a', border: '#86efac' };
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
        return { label: 'RAR', bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      default:
        return { label: 'FILE', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const badge = getFileBadgeSettings(fileExtension);
  const isArchive = ['zip', 'rar', '7z', 'tar'].includes(fileExtension);

  return (
    <a 
      href={attachmentUrl}
      download={originalName} // 🎯 Downloads file with its true original filename structure preserved
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        background: isMe ? 'rgba(0, 0, 0, 0.12)' : '#f8fafc',
        border: isMe ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
        borderRadius: '10px',
        textDecoration: 'none',
        color: isMe ? '#ffffff' : '#0f172a',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'background 0.2s ease',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = isMe ? 'rgba(0,0,0,0.18)' : '#f1f5f9'}
      onMouseLeave={(e) => e.currentTarget.style.background = isMe ? 'rgba(0,0,0,0.12)' : '#f8fafc'}
    >
      {/* Dynamic Styled Brand Icon Badge Container */}
      <div style={{
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        background: badge.bg,
        color: badge.text,
        border: `1px solid ${badge.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {isArchive ? <FolderArchive size={15} /> : <FileText size={15} />}
        <span style={{ fontSize: '0.52rem', fontWeight: 900, marginTop: '-1px', letterSpacing: '0.02em' }}>
          {badge.label}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {originalName} {/* 🎯 Shows original filename directly to your support customers */}
        </span>
        <span style={{ fontSize: '0.64rem', color: isMe ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
          Click to download
        </span>
      </div>

      <div style={{ color: isMe ? '#ffffff' : '#64748b', flexShrink: 0, paddingRight: '2px' }}>
        <Download size={14} strokeWidth={2.5} />
      </div>
    </a>
  );
};
