import { aiLabel, type AiArt } from "../landing-assets.js";
import { mono } from "./type.js";

type AiImageProps = {
  art: AiArt;
  caption?: string;
  className?: string;
  imageClassName?: string;
  labelClassName?: string;
  loading?: "lazy" | "eager";
  dataAttribute?: string;
};

export function aiAlt(art: AiArt): string {
  return `${aiLabel} of ${art.subject}`;
}

export function AiImage({
  art,
  caption,
  className = "",
  imageClassName = "",
  labelClassName = "",
  loading = "lazy",
  dataAttribute,
}: AiImageProps) {
  const marker = dataAttribute === undefined ? {} : { [dataAttribute]: "" };
  return (
    <figure className={className}>
      <img
        {...marker}
        src={art.src}
        alt={aiAlt(art)}
        width={art.width}
        height={art.height}
        loading={loading}
        decoding="async"
        className={imageClassName}
      />
      <figcaption className={`${mono.xs} flex flex-wrap gap-x-[1ch] ${labelClassName}`}>
        <span data-ai-label="">{aiLabel}</span>
        {caption !== undefined && <span className="text-muted">· {caption}</span>}
      </figcaption>
    </figure>
  );
}
