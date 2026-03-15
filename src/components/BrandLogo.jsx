import React from "react";

const brandMark = `${process.env.PUBLIC_URL}/brand/brand-mark.svg`;
const brandLogoHorizontal = `${process.env.PUBLIC_URL}/brand/brand-logo-horizontal.svg`;

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
    {compact ? (
      <img
        src={brandMark}
        alt="Fliprop"
        className={`h-10 w-10 object-contain ${imageClassName}`.trim()}
      />
    ) : (
      <>
        <img
          src={brandLogoHorizontal}
          alt="Fliprop"
          className={`h-10 w-auto max-w-[170px] object-contain sm:h-11 sm:max-w-[188px] ${imageClassName}`.trim()}
        />
        {caption ? (
          <p className={`mt-1 text-xs text-ink-500 ${captionClassName}`.trim()}>{caption}</p>
        ) : null}
      </>
    )}
  </div>
);

export default BrandLogo;
