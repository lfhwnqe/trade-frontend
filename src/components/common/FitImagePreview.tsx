"use client";

import React from "react";

type FitImagePreviewProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

export function FitImagePreview({ src, alt, className = "", imageClassName = "" }: FitImagePreviewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const imageStyle = React.useMemo<React.CSSProperties>(() => {
    const { width: containerWidth, height: containerHeight } = containerSize;
    const { width: imageWidth, height: imageHeight } = naturalSize;
    if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
      return { maxWidth: "100%", maxHeight: "100%" };
    }

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imageWidth / imageHeight;
    return imageRatio >= containerRatio
      ? { width: "100%", height: "auto", maxHeight: "100%" }
      : { width: "auto", height: "100%", maxWidth: "100%" };
  }, [containerSize, naturalSize]);

  return (
    <div ref={containerRef} className={`flex h-full w-full items-center justify-center overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`block object-contain ${imageClassName}`}
        style={imageStyle}
        onLoad={(event) => {
          setNaturalSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          });
        }}
      />
    </div>
  );
}
