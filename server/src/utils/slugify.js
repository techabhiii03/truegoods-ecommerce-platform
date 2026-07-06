// Converts "Wireless Mouse - Black" -> "wireless-mouse-black"
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // collapse whitespace/underscores into single dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
};

module.exports = slugify;
