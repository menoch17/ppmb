const INLINE_RULES: Array<[RegExp, string]> = [
  [/\[b\](.*?)\[\/b\]/gis, "<strong>$1</strong>"],
  [/\[i\](.*?)\[\/i\]/gis, "<em>$1</em>"],
  [/\[u\](.*?)\[\/u\]/gis, "<u>$1</u>"],
  [/\[s\](.*?)\[\/s\]/gis, "<s>$1</s>"],
  [/\[quote\](.*?)\[\/quote\]/gis, "<blockquote>$1</blockquote>"],
  [/\[url\](https?:\/\/[^\[]+)\[\/url\]/gis, '<a href="$1" target="_blank" rel="noreferrer">$1</a>'],
  [/\[url=(https?:\/\/[^\]]+)\](.*?)\[\/url\]/gis, '<a href="$1" target="_blank" rel="noreferrer">$2</a>'],
  [/\[img\](https?:\/\/[^\[]+)\[\/img\]/gis, '<img src="$1" alt="Embedded image" loading="lazy" />']
];

const STRIP_RULE = /\[\/?(?:color|font|size|center|left|right|indent|list|\*|code|php)[^\]]*\]/gi;

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function bbcodeToHtml(text: string | null) {
  let html = escapeHtml(text ?? "");
  for (const [pattern, replacement] of INLINE_RULES) {
    html = html.replace(pattern, replacement);
  }

  return html
    .replace(STRIP_RULE, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br />");
}
