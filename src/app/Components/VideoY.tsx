import React, { ReactNode } from "react";

interface Props {
    children?: ReactNode;
    embedId: string;
  }

const VideoY = ({ embedId }: Props) => (
  <div className="mx-auto w-full aspect-video border border-neutral-800">
    <iframe
      className="w-full h-full"
      src={`https://www.youtube.com/embed/${embedId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded youtube"
    />
  </div>
);

export default VideoY;