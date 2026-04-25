import { useState } from 'react';
import { FileText, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface PromptPreviewProps {
  compiledPrompt: string;
}

export function PromptPreview({ compiledPrompt }: PromptPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = compiledPrompt.split(/\s+/).filter(Boolean).length;
  const charCount = compiledPrompt.length;
  const approxTokens = Math.ceil(charCount / 4);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-tertiary/30 hover:bg-bg-tertiary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text-primary">Compiled System Prompt</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span>{wordCount} words</span>
          <span>~{approxTokens} tokens</span>
        </div>
      </button>

      {expanded && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded text-[10px] text-text-secondary hover:bg-bg-hover z-10"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre className="p-3 text-[11px] text-text-secondary font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
            {compiledPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
