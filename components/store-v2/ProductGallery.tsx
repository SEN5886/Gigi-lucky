"use client";

import { useState } from "react";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const image = images[current] ?? images[0];
  if (!image) return null;
  return (
    <div className="grid min-w-0 gap-2">
      <img className="v2-photo" src={image} alt={title} />
      {images.length > 1 ? (
        <div className="v2-thumbs">
          {images.map((item, index) => (
            <button key={`${item}-${index}`} type="button" data-active={index === current} aria-label={`查看第 ${index + 1} 张`} onClick={() => setCurrent(index)}>
              <img src={item} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
