import React from 'react';

const syntaxHighlight = (code: string, language: string) => {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'json') {
    highlighted = highlighted.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-400';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-indigo-400';
          } else {
            cls = 'text-emerald-400';
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-amber-400';
        } else if (/null/.test(match)) {
          cls = 'text-gray-400';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  } else if (language === 'js' || language === 'ts' || language === 'python' || language === 'bash') {
    const keywords = ['const', 'let', 'var', 'import', 'from', 'export', 'function', 'return', 'if', 'else', 'async', 'await', 'class', 'def', 'try', 'except', 'pass', 'require', 'module', 'exports'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    
    highlighted = highlighted
      .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-emerald-400">$&</span>') // strings
      .replace(/\b(\d+)\b/g, '<span class="text-blue-400">$&</span>') // numbers
      .replace(keywordRegex, '<span class="text-indigo-400 font-medium">$&</span>') // keywords
      .replace(/\/\/.*$/gm, '<span class="text-gray-500">$&</span>') // js comments
      .replace(/#.*$/gm, '<span class="text-gray-500">$&</span>'); // py/bash comments
  }

  return highlighted;
};

export function CodeBlock({ code, language = 'js', title }: { code: string, language?: string, title?: string }) {
  return (
    <div className="my-6 rounded-lg overflow-hidden border border-white/10 bg-[#0A0A0F] shadow-xl">
      {title && (
        <div className="flex items-center px-4 py-2 bg-white/[0.03] border-b border-white/10 text-xs font-mono text-gray-400">
          {title}
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-[13px] leading-relaxed text-gray-300">
          <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(code, language) }} />
        </pre>
      </div>
    </div>
  );
}
