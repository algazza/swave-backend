export const slugify = (string: string) => {
  return string
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const slugifyFilename = (filename: string) => {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) {
    // tidak ada extension
    return slugify(filename);
  }

  const name = filename.slice(0, lastDot);
  const ext = filename.slice(lastDot + 1).toLowerCase();

  return `${slugify(name)}.${ext}`;
};
