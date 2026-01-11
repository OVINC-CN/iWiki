import type React from 'react';
import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/useApp';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, ...props }) => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const getCodeString = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getCodeString).join('');
    if (node && typeof node === 'object' && 'props' in node) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
      return getCodeString(element.props.children);
    }
    return '';
  };

  const code = getCodeString(children);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  // Inline code (no language class)
  if (!className) {
    return <code {...props}>{children}</code>;
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t.common.copied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t.common.copy}
            </>
          )}
        </Button>
      </div>
      {language && (
        <div className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
          {language}
        </div>
      )}
      <code className={`${className} block pt-8`} {...props}>
        {children}
      </code>
    </div>
  );
};

export default CodeBlock;
