"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { extractGoogleDriveFileId, getDirectImageUrlSized } from '@/services/apiService';

interface DriveImageProps {
  url: unknown;
  alt: string;
  width: number;
  height: number;
  mode?: 'c' | 'p';
  className?: string;
  fallback?: React.ReactNode;
}

const DriveImage: React.FC<DriveImageProps> = ({ url, alt, width, height, mode = 'c', className = '', fallback }) => {
  const normalizedUrl = typeof url === 'string' ? url : '';
  const cleanedUrl = useMemo(() => {
    let u = (normalizedUrl || '').trim();
    u = u.replace(/^[@'"\s]+/, '');
    if (u && !/^https?:\/\//i.test(u) && u.includes('drive.google.com')) {
      u = `https://${u}`;
    }
    return u;
  }, [normalizedUrl]);

  const fileId = useMemo(() => extractGoogleDriveFileId(cleanedUrl || ''), [cleanedUrl]);
  
  const candidates = useMemo(() => {
    if (fileId) {
      const sizeParams = mode === 'c' ? `=w${width}-h${height}-c` : `=w${width}-h${height}`;
      return [
        `https://lh3.googleusercontent.com/d/${fileId}${sizeParams}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}-h${height}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}`,
      ];
    }
    const direct = getDirectImageUrlSized(cleanedUrl, width, height, mode);
    const list: string[] = [];
    if (direct) list.push(direct);
    if (cleanedUrl) list.push(cleanedUrl);
    return list;
  }, [fileId, cleanedUrl, width, height, mode]);

  const [idx, setIdx] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | null>(candidates[0] || null);

  useEffect(() => {
    setIdx(0);
    setImgSrc(candidates[0] || null);
  }, [cleanedUrl, fileId, width, height, mode, candidates.length, candidates]);

  const handleError = () => {
    const nextIdx = idx + 1;
    if (nextIdx < candidates.length) {
      setIdx(nextIdx);
      setImgSrc(candidates[nextIdx]);
    } else {
      setImgSrc(null);
    }
  };

  if (!imgSrc) {
    return fallback ?? null;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
};

export default DriveImage;
