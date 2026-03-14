import React from "react";

import brandLogo from "../logo.svg";

const BrandLogo = ({
  caption = "",
  compact = false,
  className = "",
  imageClassName = "",
  captionClassName = "",
}) => (
  <div
    className={`${compact ? "flex items-center justify-center" : "flex flex-col"} ${className}`.trim()}
  >
    <img
      src={brandLogo}
      alt="Fliprop"
      className={`object-contain ${
        compact ? "h-9 w-auto max-w-[58px]" : "h-10 w-auto max-w-[160px] sm:h-11 sm:max-w-[180px]"
      } ${imageClassName}`.trim()}
    />
    {caption ? (
      <p className={`mt-1 text-xs text-ink-500 ${captionClassName}`.trim()}>{caption}</p>
    ) : null}
  </div>
);

export default BrandLogo;
