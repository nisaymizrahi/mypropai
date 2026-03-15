import React from "react";

const brandIcon = `${process.env.PUBLIC_URL}/brand-icon.png`;

const BrandLogo = ({
  caption = "",
  compact = false,
  className = "",
  imageClassName = "",
  captionClassName = "",
}) => (
  <div
    className={`${compact ? "flex items-center justify-center" : "flex items-center gap-3"} ${className}`.trim()}
  >
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-ink-100/80 bg-white/90 shadow-[0_10px_30px_rgba(28,23,19,0.08)] ${
        compact ? "h-10 w-10" : "h-11 w-11 sm:h-12 sm:w-12"
      } ${imageClassName}`.trim()}
    >
      <img
        src={brandIcon}
        alt="Fliprop"
        className={`object-contain ${compact ? "h-[118%] w-[118%]" : "h-[122%] w-[122%]"}`.trim()}
      />
    </span>
    {!compact ? (
      <div className="min-w-0">
        <p className="font-display text-[1.1rem] leading-none tracking-[-0.02em] text-ink-900 sm:text-[1.24rem]">
          Fliprop
        </p>
        {caption ? (
          <p className={`mt-1 text-xs text-ink-500 ${captionClassName}`.trim()}>{caption}</p>
        ) : null}
      </div>
    ) : null}
  </div>
);

export default BrandLogo;
