import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { getDocDetail, createDoc, updateDoc, getTags } from '@/api';
import { useApp } from '@/contexts/useApp';
import { useModal } from '@/contexts/useModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { uploadFileToCOS } from '@/utils/cos';
import { Loading } from '@/components/Loading';
import { CodeBlock, PreBlock } from '@/components/CodeBlock';
import { ImagePreview } from '@/components/ImagePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { docDetailPath } from '@/routes';
import type { TagInfo, EditDocRequest } from '@/types';
import {
    ArrowLeft,
    Bold,
    Italic,
    Strikethrough,
    Heading2,
    Quote,
    Code,
    FileCode,
    LinkIcon,
    Image,
    Paperclip,
    List,
    ListOrdered,
    CheckSquare,
    Calculator,
    GitBranch,
    Eye,
    EyeOff,
    Upload,
    X,
} from 'lucide-react';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

const ToolbarButton = ({
    icon: Icon,
    tooltip,
    onClick,
}: {
  icon: React.ElementType;
  tooltip: string;
  onClick: () => void;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick}>
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export const DocEditor: React.FC<{ id?: string }> = ({ id }) => {
    const navigate = useNavigate();
    const { hasPermission } = useApp();
    const { showAlert } = useModal();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);

    const isEditing = !!id;
    const canUpload = hasPermission('upload_file');

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [headerImg, setHeaderImg] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [allTags, setAllTags] = useState<TagInfo[]>([]);

    const [showPreview, setShowPreview] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    useDocumentTitle(isEditing && title ? title : '写文章');

    // 编辑时加载已有文档
    useEffect(() => {
        if (isEditing && id) {
            const fetchDoc = async () => {
                try {
                    const response = await getDocDetail(id);
                    const doc = response.data.data;
                    setTitle(doc.title);
                    setContent(doc.content);
                    setHeaderImg(doc.header_img || '');
                    setIsPublic(doc.is_public);
                    setTags(doc.tags.map((t) => t));
                } catch {
                    navigate('/docs');
                } finally {
                    setLoading(false);
                }
            };
            fetchDoc();
        } else {
            // 新建时读取本地草稿
            const cached = localStorage.getItem('doc_draft');
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // 仅恢复最近 24 小时内保存的草稿
                    if (Date.now() - data.updatedAt < 24 * 60 * 60 * 1000) {
                        setTitle(data.title || '');
                        setContent(data.content || '');
                        setHeaderImg(data.headerImg || '');
                        setIsPublic(data.isPublic ?? true);
                        setTags(data.tags || []);
                    }
                } catch {
                    console.error('Failed to load draft');
                }
            }
            setLoading(false);
        }
    }, [id, isEditing, navigate]);

    // 内容变化后保存本地草稿
    useEffect(() => {
        if (!isEditing && !loading) {
            const timer = setTimeout(() => {
                const data = {
                    title,
                    content,
                    headerImg,
                    isPublic,
                    tags,
                    updatedAt: Date.now(),
                };
                localStorage.setItem('doc_draft', JSON.stringify(data));
            }, 1000); // 延迟合并保存
            return () => clearTimeout(timer);
        }
    }, [title, content, headerImg, isPublic, tags, isEditing, loading]);

    // 加载全部标签供编辑时选择
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await getTags();
                setAllTags(response.data.data || []);
            } catch {
                console.error('Failed to fetch tags');
            }
        };
        fetchTags();
    }, []);

    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            showAlert('请输入文章标题');
            return;
        }
        if (!content.trim()) {
            showAlert('请输入文章内容');
            return;
        }

        try {
            setSaving(true);
            const data: EditDocRequest = {
                title: title.trim(),
                content,
                header_img: headerImg || '',
                is_public: isPublic,
                tags,
            };

            if (isEditing && id) {
                await updateDoc(id, data);
                navigate(docDetailPath(id));
            } else {
                const response = await createDoc(data);
                localStorage.removeItem('doc_draft');
                navigate(docDetailPath(response.data.data.id));
            }
        } catch {
            showAlert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    }, [title, content, headerImg, isPublic, tags, isEditing, id, navigate, showAlert]);

    const handleHeaderImageUpload = useCallback(async (file: File) => {
        if (!canUpload) {
            showAlert('您没有上传图片的权限');
            return;
        }

        try {
            setUploadProgress(0);
            const url = await uploadFileToCOS(file, setUploadProgress);
            setHeaderImg(url);
        } catch {
            showAlert('图片上传失败');
        } finally {
            setUploadProgress(null);
        }
    }, [canUpload, showAlert]);

    const handleHeaderImagePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) {
            return;
        }

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleHeaderImageUpload(file);
                }
                break;
            }
        }
    }, [handleHeaderImageUpload]);

    const handleHeaderImageDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (!files) {
            return;
        }

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                handleHeaderImageUpload(file);
                break;
            }
        }
    }, [handleHeaderImageUpload]);

    const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
            setShowTagSuggestions(false);
        }
    }, [tagInput, tags]);

    const handleSelectTag = useCallback((tagName: string) => {
        if (!tags.includes(tagName)) {
            setTags([...tags, tagName]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
    }, [tags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    }, [tags]);

    const handleImageUpload = useCallback(async (file: File) => {
        if (!canUpload) {
            showAlert('您没有上传图片的权限');
            return;
        }

        try {
            setUploadProgress(0);
            const url = await uploadFileToCOS(file, setUploadProgress);

            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const imageMarkdown = `![${file.name}](${url})`;
                const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
                setContent(newContent);

                setTimeout(() => {
                    textarea.focus();
                    const newPos = start + imageMarkdown.length;
                    textarea.setSelectionRange(newPos, newPos);
                }, 0);
            }
        } catch {
            showAlert('图片上传失败');
        } finally {
            setUploadProgress(null);
        }
    }, [canUpload, content, showAlert]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!canUpload) {
            showAlert('您没有上传图片的权限');
            return;
        }

        try {
            setUploadProgress(0);
            const url = await uploadFileToCOS(file, setUploadProgress);

            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const fileMarkdown = `[${file.name}](${url})`;
                const newContent = content.substring(0, start) + fileMarkdown + content.substring(end);
                setContent(newContent);

                setTimeout(() => {
                    textarea.focus();
                    const newPos = start + fileMarkdown.length;
                    textarea.setSelectionRange(newPos, newPos);
                }, 0);
            }
        } catch {
            showAlert('图片上传失败');
        } finally {
            setUploadProgress(null);
        }
    }, [canUpload, content, showAlert]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) {
            return;
        }

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleImageUpload(file);
                }
                break;
            }
        }
    }, [handleImageUpload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (!files) {
            return;
        }

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                handleImageUpload(file);
                break;
            }
        }
    }, [handleImageUpload]);

    const insertMarkdown = useCallback((prefix: string, suffix = '') => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            const newPos = start + prefix.length + selectedText.length + suffix.length;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    }, [content]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }

            const spaces = '    ';
            // 使用编辑命令保留撤销历史
            document.execCommand('insertText', false, spaces);
        }
    }, []);

    if (loading) {
        return <Loading fullPage text="加载中..." />;
    }

    return (
        <motion.div
            className="flex flex-col h-[calc(100vh-3.5rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* 顶部 */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background h-14">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                    <Button asChild variant="ghost" size="icon" className="shrink-0">
                        <Link to={id ? docDetailPath(id) : '/docs'}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Input
                        type="text"
                        placeholder="输入文章标题..."
                        className="h-8"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? '编辑' : '预览'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} disabled={saving}>
                        取消
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : isEditing ? '更新' : '发布'}
                    </Button>
                </div>
            </div>

            {/* 正文 */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* 工具栏 */}
                <div className={cn('flex items-center gap-1 px-4 py-2 border-b bg-muted/50 overflow-x-auto', showPreview && 'hidden')}>
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Bold} tooltip="粗体" onClick={() => insertMarkdown('**', '**')} />
                        <ToolbarButton icon={Italic} tooltip="斜体" onClick={() => insertMarkdown('*', '*')} />
                        <ToolbarButton icon={Strikethrough} tooltip="删除线" onClick={() => insertMarkdown('~~', '~~')} />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Heading2} tooltip="标题" onClick={() => insertMarkdown('## ')} />
                        <ToolbarButton icon={Quote} tooltip="引用" onClick={() => insertMarkdown('> ')} />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Code} tooltip="代码" onClick={() => insertMarkdown('`', '`')} />
                        <ToolbarButton icon={FileCode} tooltip="代码块" onClick={() => insertMarkdown('```\n', '\n```')} />
                        <ToolbarButton icon={LinkIcon} tooltip="链接" onClick={() => insertMarkdown('[', '](url)')} />
                        <ToolbarButton icon={Image} tooltip="图片" onClick={() => fileInputRef.current?.click()} />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleImageUpload(file);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <ToolbarButton icon={Paperclip} tooltip="文件" onClick={() => fileUploadRef.current?.click()} />
                        <input
                            type="file"
                            ref={fileUploadRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleFileUpload(file);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={List} tooltip="无序列表" onClick={() => insertMarkdown('- ')} />
                        <ToolbarButton icon={ListOrdered} tooltip="有序列表" onClick={() => insertMarkdown('1. ')} />
                        <ToolbarButton icon={CheckSquare} tooltip="任务列表" onClick={() => insertMarkdown('- [ ] ')} />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton icon={Calculator} tooltip="数学公式" onClick={() => insertMarkdown('$', '$')} />
                        <ToolbarButton icon={GitBranch} tooltip="Mermaid图表" onClick={() => insertMarkdown('```mermaid\ngraph TD\n  A --> B\n', '\n```')} />
                    </div>
                </div>

                {/* 编辑区域 */}
                <div className="flex flex-1 overflow-hidden">
                    <div className={cn('flex flex-col flex-1 min-w-0 border-r', showPreview ? 'hidden md:flex' : 'flex')}>
                        <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b bg-muted/30">
                            编辑
                        </div>
                        <textarea
                            ref={textareaRef}
                            className="flex-1 p-4 resize-none border-0 focus:outline-none focus:ring-0 bg-background font-mono text-sm"
                            placeholder="开始写作..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        />
                    </div>
                    <div className={cn('flex flex-col flex-1 min-w-0 overflow-hidden', showPreview ? 'flex' : 'hidden md:flex')}>
                        <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b bg-muted/30">
                            预览
                        </div>
                        <div className="flex-1 overflow-auto p-4 prose prose-neutral dark:prose-invert max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                                components={{ code: CodeBlock, pre: PreBlock, img: ImagePreview }}
                            >
                                {content || '*开始输入内容查看预览...*'}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* 文档属性 */}
                <div className={cn('border-t bg-muted/30 p-4', showPreview && 'hidden')}>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-50 space-y-2 h-10">
                            <label className="text-sm font-medium">头图 URL</label>
                            <div className="flex gap-2 h-full">
                                <Input
                                    type="url"
                                    className="h-10"
                                    placeholder="https://example.com/image.jpg"
                                    value={headerImg}
                                    onChange={(e) => setHeaderImg(e.target.value)}
                                    onPaste={handleHeaderImagePaste}
                                    onDrop={handleHeaderImageDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                />
                                {canUpload && (
                                    <Button variant="outline" size="icon" asChild className="shrink-0 h-full">
                                        <label className="cursor-pointer">
                                            <Upload className="h-4 w-4" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleHeaderImageUpload(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-sm font-medium">标签</label>
                            <div className="relative">
                                <div
                                    className="flex flex-wrap items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text overflow-y-auto"
                                    onClick={() => setShowTagSuggestions(true)}
                                >
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                className="hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTag(tag);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <input
                                        type="text"
                                        className="flex-1 min-w-20 bg-transparent outline-none placeholder:text-muted-foreground"
                                        placeholder={tags.length === 0 ? '输入标签后按回车...' : ''}
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        onFocus={() => setShowTagSuggestions(true)}
                                    />
                                </div>
                                {showTagSuggestions && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowTagSuggestions(false)} />
                                        <div className="absolute bottom-full left-0 right-0 mb-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-md z-50" style={{ minWidth: 200 }}>
                                            {allTags
                                                ?.filter((t) => !tags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase()))
                                                .map((tag) => (
                                                    <button
                                                        key={tag.id}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                                        onClick={() => handleSelectTag(tag.name)}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            {allTags?.filter((t) => !tags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {tagInput ? `${'按回车创建'} "${tagInput}"` : '输入以创建标签'}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">可见性</label>
                            <ToggleGroup type="single" value={isPublic ? 'public' : 'private'} onValueChange={(v) => v && setIsPublic(v === 'public')} className="border rounded-lg p-0.5 bg-muted/50 h-10">
                                <ToggleGroupItem value="public" className="gap-1 h-full data-[state=on]:bg-green-500 data-[state=on]:text-white data-[state=on]:shadow-sm">
                                    <Eye className="h-4 w-4" />
                                    公开
                                </ToggleGroupItem>
                                <ToggleGroupItem value="private" className="gap-1 h-full data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-sm">
                                    <EyeOff className="h-4 w-4" />
                                    私密
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                </div>
            </div>

            {/* 上传进度 */}
            {uploadProgress !== null && (
                <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 min-w-[200px]">
                    <div className="text-sm mb-2">
                        上传中... {uploadProgress}%
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DocEditor;
