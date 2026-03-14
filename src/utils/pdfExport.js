const DEFAULT_PDF_OPTIONS = {
  margin: [0.32, 0.32, 0.4, 0.32],
  filename: "report.pdf",
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f6f1ea",
  },
  jsPDF: {
    unit: "in",
    format: "letter",
    orientation: "portrait",
    compress: true,
  },
  pagebreak: {
    mode: ["css", "legacy"],
  },
};

export const sanitizePdfFilename = (value = "report") =>
  String(value || "report")
    .trim()
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return !/[<>:"/\\|?*]/.test(character) && code >= 32;
    })
    .join("")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "report";

export const exportElementToPdf = async ({ element, filename, options = {} }) => {
  if (!element) {
    throw new Error("Nothing is ready to export yet.");
  }

  const module = await import("html2pdf.js");
  const html2pdf = module.default || module;

  const mergedOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    filename: filename || options.filename || DEFAULT_PDF_OPTIONS.filename,
    image: {
      ...DEFAULT_PDF_OPTIONS.image,
      ...(options.image || {}),
    },
    html2canvas: {
      ...DEFAULT_PDF_OPTIONS.html2canvas,
      ...(options.html2canvas || {}),
    },
    jsPDF: {
      ...DEFAULT_PDF_OPTIONS.jsPDF,
      ...(options.jsPDF || {}),
    },
    pagebreak: {
      ...DEFAULT_PDF_OPTIONS.pagebreak,
      ...(options.pagebreak || {}),
    },
  };

  await html2pdf().set(mergedOptions).from(element).save();
};
