"use client";

import { useState, useEffect } from "react";

interface ImageProxyProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ImageProxy = ({ src, alt, className, onLoad, onError }: ImageProxyProps) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      onError?.();
      return;
    }

    // Try to load the image through fetch to bypass CORS
    const loadImage = async () => {
      try {
        const response = await fetch(src, {
          mode: 'no-cors',
          cache: 'force-cache'
        });
        
        if (response.type === 'opaque') {
          // For no-cors mode, we can't read the response but we can display it
          setImageData(src);
          setLoading(false);
          onLoad?.();
        } else {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageData(objectUrl);
          setLoading(false);
          onLoad?.();
        }
      } catch (err) {
        setError(true);
        setLoading(false);
        onError?.();
      }
    };

    loadImage();

    return () => {
      if (imageData && imageData.startsWith('blob:')) {
        URL.revokeObjectURL(imageData);
      }
    };
  }, [src]);

  if (error || !imageData) {
    return null;
  }

  return (
    <img
      src={imageData}
      alt={alt}
      className={className}
      onLoad={() => {
        setLoading(false);
        onLoad?.();
      }}
      onError={() => {
        setError(true);
        setLoading(false);
        onError?.();
      }}
    />
  );
};

export default ImageProxy;