import { useState } from 'react';

const FALLBACK = '/favicon.svg';

export default function OptimizedImage({
  src,
  alt = '',
  eager = false,
  className,
  width,
  height,
  onError,
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const source = failed || !src ? FALLBACK : src;

  return (
    <img
      src={source}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      width={width}
      height={height}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
