export type RichContentBlock = { type: "markdown"; text: string } | { type: "table"; headings: string[]; rows: string[][] };

/** Split only unescaped pipes outside inline code; preserve Markdown inside cells. */
function pipeRow(line: string): string[] | null {
  if (/^(?: {4}|\t)/.test(line) || /^\s{0,3}(?:#{1,6}\s|>\s|[-*+]\s|\d+[.)]\s)/.test(line)) return null;
  const text = line.trim();
  const cells: string[] = [];
  let cell = ""; let codeTicks = 0; let delimiters = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\" && i + 1 < text.length) { cell += char + text[++i]; continue; }
    if (char === "`") {
      let count = 1;
      while (text[i + count] === "`") count++;
      if (!codeTicks) codeTicks = count; else if (codeTicks === count) codeTicks = 0;
      cell += "`".repeat(count); i += count - 1; continue;
    }
    if (char === "|" && !codeTicks) { cells.push(cell.trim()); cell = ""; delimiters++; }
    else cell += char;
  }
  if (!delimiters) return null;
  cells.push(cell.trim());
  if (text.startsWith("|")) cells.shift();
  if (text.endsWith("|") && cells.at(-1) === "") cells.pop();
  return cells.length >= 2 ? cells : null;
}
const separator = (cells: string[]) => cells.every(cell => /^:?-{3,}:?$/.test(cell));

/** Generated handouts can contain a real table even when the separator row is omitted. */
export function splitRichContent(text: string): RichContentBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichContentBlock[] = []; let prose: string[] = [];
  let fence: { char: string; length: number } | null = null;
  const flush = () => { const content = prose.join("\n"); if (content.trim()) blocks.push({ type: "markdown", text: content }); prose = []; };
  for (let i = 0; i < lines.length;) {
    const line = lines[i]; const fenceStart = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      prose.push(line);
      if (fenceStart && fenceStart[1][0] === fence.char && fenceStart[1].length >= fence.length && line.slice(line.indexOf(fenceStart[1]) + fenceStart[1].length).trim() === "") fence = null;
      i++; continue;
    }
    if (fenceStart) { fence = { char: fenceStart[1][0], length: fenceStart[1].length }; prose.push(line); i++; continue; }
    const headings = pipeRow(line);
    if (!headings || headings.every(cell => !cell) || separator(headings)) { prose.push(line); i++; continue; }
    let next = i + 1; const second = next < lines.length ? pipeRow(lines[next]) : null;
    if (second && second.length === headings.length && separator(second)) next++;
    const rows: string[][] = [];
    while (next < lines.length) {
      const row = pipeRow(lines[next]);
      if (!row || row.length !== headings.length || separator(row)) break;
      rows.push(row); next++;
    }
    if (!rows.length) { prose.push(line); i++; continue; }
    flush(); blocks.push({ type: "table", headings, rows }); i = next;
  }
  flush(); return blocks;
}
