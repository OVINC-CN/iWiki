import React, { useState, useCallback, useEffect, useRef, useId } from 'react';
import { Check, Copy } from 'lucide-react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/useApp';

// Initialize mermaid with macaron color scheme (cool tones)
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        // Primary colors - soft blue
        primaryColor: '#A2D2FF',
        primaryTextColor: '#4A5568',
        primaryBorderColor: '#89CFF0',
        // Secondary - mint green
        secondaryColor: '#B5EAD7',
        secondaryTextColor: '#4A5568',
        secondaryBorderColor: '#98D8C8',
        // Tertiary - lavender
        tertiaryColor: '#C3B1E1',
        tertiaryTextColor: '#4A5568',
        tertiaryBorderColor: '#B8A9D9',
        // Lines and text
        lineColor: '#94A3B8',
        textColor: '#4A5568',
        // Background
        mainBkg: '#F0F9FF',
        // Node colors for flowcharts
        nodeBorder: '#89CFF0',
        clusterBkg: '#F0FDF4',
        clusterBorder: '#98D8C8',
        // Sequence diagram
        actorBkg: '#E0E7FF',
        actorBorder: '#C7D2FE',
        actorTextColor: '#4A5568',
        signalColor: '#94A3B8',
        // State diagram
        labelColor: '#4A5568',
        // Pie chart
        pie1: '#A2D2FF',
        pie2: '#B5EAD7',
        pie3: '#C3B1E1',
        pie4: '#A0E7E5',
        pie5: '#B8C1EC',
        pie6: '#98D8C8',
        pie7: '#BDE0FE',
        pie8: '#E0BBE4',
    },
});

interface MermaidBlockProps {
    code: string;
}

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const id = useId();
    const mermaidId = `mermaid${id.replace(/:/g, '-')}`;

    useEffect(() => {
        let isMounted = true;

        const renderMermaid = async () => {
            try {
                const { svg: renderedSvg } = await mermaid.render(mermaidId, code);
                if (isMounted) {
                    const safeSvg = DOMPurify.sanitize(renderedSvg, {
                        USE_PROFILES: { svg: true, svgFilters: true },
                        ADD_TAGS: ['foreignObject'],
                        ADD_ATTR: ['id', 'width', 'height', 'viewBox', 'preserveAspectRatio', 'style'],
                    });
                    setSvg(safeSvg);
                    setError(null);
                }
            } catch (e) {
                if (isMounted) {
                    setError(e instanceof Error ? e.message : 'Failed to render mermaid diagram');
                }
            }
        };

        renderMermaid();

        return () => {
            isMounted = false;
        };
    }, [code, mermaidId]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">Mermaid Error: {error}</p>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto">{code}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

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

    // Mermaid code blocks - render with MermaidBlock component
    if (language === 'mermaid') {
        return <MermaidBlock code={code} />;
    }

    return (
        <div className="relative group">
            <div className="flex items-center justify-between pb-1 bg-gray-100 border-b border-gray-200 rounded-t-md">
                <span className="text-xs text-gray-500 font-mono">
                    {language || 'code'}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    scrollbarColor: '#d1d5db transparent',
                }}
                {...props}
            >
                {children}
            </code>
        </div>
    );
};

export default CodeBlock;

interface PreBlockProps {
    children?: React.ReactNode;
}

export const PreBlock: React.FC<PreBlockProps> = ({ children, ...props }) => {
    // Check if this pre contains a mermaid code block
    const isMermaid = React.Children.toArray(children).some((child) => {
        if (React.isValidElement(child)) {
            const className = (child.props as { className?: string })?.className || '';
            return /language-mermaid/.test(className);
        }
        return false;
    });

    // For mermaid, render without pre wrapper styling
    if (isMermaid) {
        return children as React.ReactElement;
    }

    return <pre {...props}>{children}</pre>;
};
