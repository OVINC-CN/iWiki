import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { getDocDetail, createDoc, updateDoc, getTags } from '@/api';
import { useApp } from '@/contexts/useApp';
import { useModal } from '@/contexts/useModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { uploadFileToCOS } from '@/utils/cos';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
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

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#334155',
    lineColor: '#94a3b8',
    secondaryColor: '#e2e8f0',
    tertiaryColor: '#f1f5f9',
    textColor: '#1e293b',
    mainBkg: '#e2e8f0',
    nodeBorder: '#334155',
    nodeTextColor: '#1e293b',
  },
});

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

export const DocEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, t } = useApp();
  const { showAlert } = useModal();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const isEditing = !!id;
  const canUpload = hasPermission('upload_file');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [headerImg, setHeaderImg] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<TagInfo[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  useDocumentTitle(isEditing && title ? title : t.common.write);

  // Load document data if editing
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
      // Load from cache if creating new doc
      const cached = localStorage.getItem('doc_draft');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          // Only load if cache is recent (e.g. within 24 hours)
          if (Date.now() - data.updatedAt < 24 * 60 * 60 * 1000) {
            setTitle(data.title || '');
            setContent(data.content || '');
            setHeaderImg(data.headerImg || '');
            setIsPublic(data.isPublic ?? true);
            setTags(data.tags || []);
          }
        } catch (e) {
          console.error('Failed to load draft', e);
        }
      }
      setLoading(false);
    }
  }, [id, isEditing, navigate]);

  // Save to cache when content changes
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
      }, 1000); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [title, content, headerImg, isPublic, tags, isEditing, loading]);

  // Update preview key when content changes to force re-render
  useEffect(() => {
    if (content) {
      const timer = setTimeout(() => {
        setPreviewKey(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [content]);

  // Render mermaid diagrams in preview
  useEffect(() => {
    const renderMermaid = async () => {
      const previewContainer = document.querySelector('.prose');
      if (!previewContainer) return;

      const codeBlocks = previewContainer.querySelectorAll('pre code.language-mermaid');
      for (let i = 0; i < codeBlocks.length; i++) {
        const codeBlock = codeBlocks[i];
        const preElement = codeBlock.parentElement;
        if (!preElement) continue;

        const code = codeBlock.textContent || '';
        try {
          const { svg } = await mermaid.render(`mermaid-editor-${i}-${Date.now()}`, code);
          const container = document.createElement('div');
          container.className = 'mermaid';
          const safeSvg = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['foreignObject'],
            ADD_ATTR: ['id', 'width', 'height', 'viewBox', 'preserveAspectRatio', 'style'],
          });
          container.innerHTML = safeSvg;
          preElement.replaceWith(container);
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      }
    };
    const timer = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timer);
  }, [previewKey]);

  // Load all tags for suggestions
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await getTags();
        setAllTags(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      showAlert(t.editor.enterTitle);
      return;
    }
    if (!content.trim()) {
      showAlert(t.editor.enterContent);
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
        navigate(`/docs/${id}`);
      } else {
        const response = await createDoc(data);
        localStorage.removeItem('doc_draft');
        navigate(`/docs/${response.data.data.id}`);
      }
    } catch {
      showAlert(t.editor.saveFailed);
    } finally {
      setSaving(false);
    }
  }, [title, content, headerImg, isPublic, tags, isEditing, id, navigate, t, showAlert]);

  const handleHeaderImageUpload = useCallback(async (file: File) => {
    if (!canUpload) {
      showAlert(t.editor.noUploadPerm);
      return;
    }

    try {
      setUploadProgress(0);
      const url = await uploadFileToCOS(file, setUploadProgress);
      setHeaderImg(url);
    } catch {
      showAlert(t.editor.uploadFailed);
    } finally {
      setUploadProgress(null);
    }
  }, [canUpload, t, showAlert]);

  const handleHeaderImagePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

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
    if (!files) return;

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
      showAlert(t.editor.noUploadPerm);
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
      showAlert(t.editor.uploadFailed);
    } finally {
      setUploadProgress(null);
    }
  }, [canUpload, content, t, showAlert]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!canUpload) {
      showAlert(t.editor.noUploadPerm);
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
      showAlert(t.editor.uploadFailed);
    } finally {
      setUploadProgress(null);
    }
  }, [canUpload, content, t, showAlert]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

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
    if (!files) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
        break;
      }
    }
  }, [handleImageUpload]);

  const insertMarkdown = useCallback((prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

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

  if (loading) {
    return <Loading fullPage text={t.common.loading} />;
  }

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-3.5rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background h-14">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link to={isEditing ? `/docs/${id}` : '/docs'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Input
            type="text"
            placeholder={t.editor.titlePlaceholder}
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
            {showPreview ? t.common.edit : t.editor.preview}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t.editor.saving : isEditing ? t.common.update : t.common.publish}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className={cn('flex items-center gap-1 px-4 py-2 border-b bg-muted/50 overflow-x-auto', showPreview && 'hidden')}>
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Bold} tooltip={t.editor.tools.bold} onClick={() => insertMarkdown('**', '**')} />
            <ToolbarButton icon={Italic} tooltip={t.editor.tools.italic} onClick={() => insertMarkdown('*', '*')} />
            <ToolbarButton icon={Strikethrough} tooltip={t.editor.tools.strikethrough} onClick={() => insertMarkdown('~~', '~~')} />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Heading2} tooltip={t.editor.tools.heading} onClick={() => insertMarkdown('## ')} />
            <ToolbarButton icon={Quote} tooltip={t.editor.tools.quote} onClick={() => insertMarkdown('> ')} />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Code} tooltip={t.editor.tools.code} onClick={() => insertMarkdown('`', '`')} />
            <ToolbarButton icon={FileCode} tooltip={t.editor.tools.codeBlock} onClick={() => insertMarkdown('```\n', '\n```')} />
            <ToolbarButton icon={LinkIcon} tooltip={t.editor.tools.link} onClick={() => insertMarkdown('[', '](url)')} />
            <ToolbarButton icon={Image} tooltip={t.editor.tools.image} onClick={() => fileInputRef.current?.click()} />
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
            <ToolbarButton icon={Paperclip} tooltip={t.editor.tools.file} onClick={() => fileUploadRef.current?.click()} />
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
            <ToolbarButton icon={List} tooltip={t.editor.tools.ul} onClick={() => insertMarkdown('- ')} />
            <ToolbarButton icon={ListOrdered} tooltip={t.editor.tools.ol} onClick={() => insertMarkdown('1. ')} />
            <ToolbarButton icon={CheckSquare} tooltip={t.editor.tools.task} onClick={() => insertMarkdown('- [ ] ')} />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Calculator} tooltip={t.editor.tools.math} onClick={() => insertMarkdown('$', '$')} />
            <ToolbarButton icon={GitBranch} tooltip={t.editor.tools.mermaid} onClick={() => insertMarkdown('```mermaid\ngraph TD\n  A --> B\n', '\n```')} />
          </div>
        </div>

        {/* Editor Area */}
        <div className={cn('flex flex-1 overflow-hidden', showPreview && 'hidden md:flex')}>
          <div className={cn('flex flex-col flex-1 border-r', showPreview && 'hidden md:flex')}>
            <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b bg-muted/30">
              {t.common.edit}
            </div>
            <textarea
              ref={textareaRef}
              className="flex-1 p-4 resize-none border-0 focus:outline-none focus:ring-0 bg-background font-mono text-sm"
              placeholder={t.editor.contentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            />
          </div>
          <div className={cn('flex-col flex-1 hidden md:flex', showPreview && 'flex')}>
            <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b bg-muted/30">
              {t.editor.preview}
            </div>
            <div className="flex-1 overflow-auto p-4 prose prose-neutral dark:prose-invert max-w-none" key={previewKey}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}>
                {content || t.editor.previewHint}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Meta Fields */}
        <div className={cn('border-t bg-muted/30 p-4', showPreview && 'hidden')}>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-50 space-y-2 h-10">
              <label className="text-sm font-medium">{t.editor.headerImg}</label>
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
                          if (file) handleHeaderImageUpload(file);
                        }}
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-sm font-medium">{t.editor.tags}</label>
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
                    placeholder={tags.length === 0 ? t.editor.tagPlaceholder : ''}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onFocus={() => setShowTagSuggestions(true)}
                  />
                </div>
                {showTagSuggestions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTagSuggestions(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-md z-50" style={{minWidth: 200}}>
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
                          {tagInput ? `${t.editor.createTag} "${tagInput}"` : t.editor.typeToCreateTag}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.editor.visibility}</label>
              <ToggleGroup type="single" value={isPublic ? 'public' : 'private'} onValueChange={(v) => v && setIsPublic(v === 'public')} className="border rounded-lg p-0.5 bg-muted/50 h-10">
                <ToggleGroupItem value="public" className="gap-1 h-full data-[state=on]:bg-green-500 data-[state=on]:text-white data-[state=on]:shadow-sm">
                  <Eye className="h-4 w-4" />
                  {t.editor.public}
                </ToggleGroupItem>
                <ToggleGroupItem value="private" className="gap-1 h-full data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-sm">
                  <EyeOff className="h-4 w-4" />
                  {t.editor.private}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="text-sm mb-2">
            {t.editor.uploading} {uploadProgress}%
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
