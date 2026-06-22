/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split content by multi-line code blocks: ```[language]\n[code]\n```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
      {parts.map((part, index) => {
        // Render block code
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const rawLanguage = match ? match[1] : "";
          const codeText = match ? match[2].trim() : part.slice(3, -3).trim();
          const displayLanguage = rawLanguage || "code";

          return (
            <div 
              key={index} 
              className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs shadow-md"
            >
              {/* Code block header panel */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-800/60 select-none">
                <span>{displayLanguage}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeText, index)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code contents scroll pane */}
              <pre className="p-4 overflow-x-auto whitespace-pre scrolling-touch scrollbar-thin scrollbar-thumb-slate-800 max-h-[350px]">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Render standard paragraph text with inline formatting
        const lines = part.split("\n");
        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();

              // Style large headers: # Header -> h1, ## Header -> h2, ### Header -> h3
              if (trimmed.startsWith("# ")) {
                return <h1 key={lineIdx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">{trimmed.slice(2)}</h1>;
              } else if (trimmed.startsWith("## ")) {
                return <h2 key={lineIdx} className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 tracking-tight">{trimmed.slice(3)}</h2>;
              } else if (trimmed.startsWith("### ")) {
                return <h3 key={lineIdx} className="text-sm font-semibold text-slate-900 dark:text-slate-200 mt-2.5 mb-1 tracking-tight">{trimmed.slice(4)}</h3>;
              }

              // Style list elements starting with "-" or "*"
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                const cleanContent = trimmed.slice(2);
                return (
                  <ul key={lineIdx} className="list-disc pl-5 my-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li className="marker:text-violet-500">{parseInlineFormatting(cleanContent)}</li>
                  </ul>
                );
              }

              // Empty lines
              if (!trimmed) return <div key={lineIdx} className="h-2"></div>;

              // Regular lines
              return (
                <p key={lineIdx} className="text-slate-700 dark:text-slate-300 antialiased leading-relaxed">
                  {parseInlineFormatting(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Simple parser for bold **text**, code `text` and key labels
function parseInlineFormatting(text: string) {
  if (!text) return "";

  // Split by inline tags: **bold** or `code`
  const matches = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return matches.map((chunk, itemIdx) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return (
        <strong key={itemIdx} className="font-bold text-slate-900 dark:text-white">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return (
        <code key={itemIdx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-violet-600 dark:text-violet-400 font-mono text-xs rounded border border-slate-200/55 dark:border-slate-800/80">
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return chunk;
  });
}
