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
        if (typeof node === 'string') {
            return node;
        }
        if (Array.isArray(node)) {
            return node.map(getCodeString).join('');
        }
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

    // Mermaid code blocks - don't wrap, let mermaid render them
    if (language === 'mermaid') {
        return <code className={className} {...props}>{children}</code>;
    }

    return (
        <div className="relative group">
            <div className="flex items-center justify-between pb-1 bg-slate-800 border-b border-slate-700 rounded-t-md">
                <span className="text-xs text-slate-400 font-mono">
                    {language || 'code'}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <code
                className={`${className} block pt-1 py-4 rounded-t-none overflow-x-auto`}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#475569 transparent',
                }}
                {...props}
            >
                {children}
            </code>
        </div>
    );
};

export default CodeBlock;
