/** Lightweight markdown renderer for AI messages (bold, code, lists, headings). */

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function AiMessageContent({ content, contentRef }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  const metricLines = lines.filter((line) => /^[-*]\s/.test(line));
  const hasMetrics = metricLines.length >= 2;

  lines.forEach((line, i) => {
    // Heading: ### or ## or #
    if (/^###\s/.test(line)) {
      const text = escapeHtml(line.replace(/^###\s/, ""));
      elements.push(
        <p key={i} className="text-sm font-bold text-slate-900 mt-1" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
      );
      return;
    }
    if (/^##\s/.test(line)) {
      const text = escapeHtml(line.replace(/^##\s/, ""));
      elements.push(
        <p key={i} className="text-sm font-bold text-slate-900 mt-1" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
      );
      return;
    }

    let html = escapeHtml(line);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800">$1</code>');

    if (/^[-*]\s/.test(line)) {
      const clean = html.replace(/^[-*]\s/, "");
      elements.push(
        <li key={i} className="text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: clean }} />
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
  });

  if (hasMetrics) {
    return (
      <div ref={contentRef} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <ul className="space-y-1">{elements}</ul>
      </div>
    );
  }

  return <div ref={contentRef} className="space-y-1">{elements}</div>;
}
