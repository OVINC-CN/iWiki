import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { getDocDetail, createDoc, updateDoc, getTags } from '../api';
import { useApp } from '../contexts/useApp';
import { useModal } from '../contexts/useModal';
import { uploadFileToCOS } from '../utils/cos';
import { Loading } from '../components/Loading';
import type { TagInfo, EditDocRequest } from '../types';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import '../styles/editor.css';
import '../styles/docDetail.css';

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
      const previewContainer = document.querySelector('.editor-preview .doc-detail-content');
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
            ADD_ATTR: ['id', 'width', 'height', 'viewBox', 'preserveAspectRatio', 'style']
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
      className="doc-editor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="editor-header">
        <div className="editor-header-left">
          <Link to={isEditing ? `/docs/${id}` : '/docs'} className="editor-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <input
            type="text"
            className="editor-title-input"
            placeholder={t.editor.titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="editor-header-right">
          <button 
            className="btn btn-secondary mobile-only" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? t.common.edit : t.editor.preview}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            {t.common.cancel}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t.editor.saving : isEditing ? t.common.update : t.common.publish}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className={`editor-toolbar ${showPreview ? 'hidden' : ''}`}>
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" data-tooltip={t.editor.tools.bold} onClick={() => insertMarkdown('**', '**')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.italic} onClick={() => insertMarkdown('*', '*')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.strikethrough} onClick={() => insertMarkdown('~~', '~~')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4H9a3 3 0 00-3 3v1a3 3 0 003 3h6" />
                <path d="M8 20h7a3 3 0 003-3v-1a3 3 0 00-3-3H8" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" data-tooltip={t.editor.tools.heading} onClick={() => insertMarkdown('## ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h8M4 6v12M12 6v12M20 8l-4 4 4 4" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.quote} onClick={() => insertMarkdown('> ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" data-tooltip={t.editor.tools.code} onClick={() => insertMarkdown('`', '`')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.codeBlock} onClick={() => insertMarkdown('```\n', '\n```')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <polyline points="9 9 5 12 9 15" />
                <polyline points="15 9 19 12 15 15" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.link} onClick={() => insertMarkdown('[', '](url)')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.image} onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                  e.target.value = ''; // Reset input
                }
              }}
            />
            <button className="toolbar-btn" data-tooltip={t.editor.tools.file} onClick={() => fileUploadRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileUploadRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                  e.target.value = ''; // Reset input
                }
              }}
            />
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" data-tooltip={t.editor.tools.ul} onClick={() => insertMarkdown('- ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.ol} onClick={() => insertMarkdown('1. ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.task} onClick={() => insertMarkdown('- [ ] ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="6" height="6" rx="1" />
                <path d="M5 11l1 1 3-3" />
                <line x1="12" y1="8" x2="21" y2="8" />
                <rect x="3" y="14" width="6" height="6" rx="1" />
                <line x1="12" y1="17" x2="21" y2="17" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" data-tooltip={t.editor.tools.math} onClick={() => insertMarkdown('$', '$')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <text x="6" y="18" fontSize="16" fontStyle="italic">∑</text>
              </svg>
            </button>
            <button className="toolbar-btn" data-tooltip={t.editor.tools.mermaid} onClick={() => insertMarkdown('```mermaid\ngraph TD\n  A --> B\n', '\n```')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="8.5" y="14" width="7" height="7" />
                <line x1="6.5" y1="10" x2="6.5" y2="14" />
                <line x1="17.5" y1="10" x2="17.5" y2="14" />
                <line x1="6.5" y1="14" x2="12" y2="14" />
                <line x1="17.5" y1="14" x2="12" y2="14" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`editor-main ${showPreview ? 'preview-mode' : ''}`}>
          <div className="editor-pane">
            <div className="editor-pane-header">{t.common.edit}</div>
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              placeholder={t.editor.contentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            />
          </div>
          <div className="editor-pane editor-preview">
            <div className="editor-pane-header">{t.editor.preview}</div>
            <div className="doc-detail-content" style={{ padding: '1.5rem' }} key={previewKey}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
              >
                {content || t.editor.previewHint}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className={`editor-meta ${showPreview ? 'hidden' : ''}`}>
          <div className="editor-meta-row">
            <div className="editor-meta-field">
              <label className="editor-meta-label">{t.editor.headerImg}</label>
              <div className="header-img-input-wrapper">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={headerImg}
                  onChange={(e) => setHeaderImg(e.target.value)}
                  onPaste={handleHeaderImagePaste}
                  onDrop={handleHeaderImageDrop}
                  onDragOver={(e) => e.preventDefault()}
                />
                {canUpload && (
                  <label className="header-img-upload-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHeaderImageUpload(file);
                      }}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="editor-meta-field">
              <label className="editor-meta-label">{t.editor.tags}</label>
              <div className="editor-tags-container">
                <div className="editor-tags-input" onClick={() => setShowTagSuggestions(true)}>
                  {tags.map((tag) => (
                    <span key={tag} className="editor-tag">
                      {tag}
                      <button className="editor-tag-remove" onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
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
                    <div className="tag-suggestions">
                      {allTags
                        ?.filter((t) => !tags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase()))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            className="tag-suggestion-item"
                            onClick={() => handleSelectTag(tag.name)}
                          >
                            {tag.name}
                          </button>
                        ))}
                      {allTags?.filter((t) => !tags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase())).length === 0 && (
                        <div className="tag-suggestion-empty">
                          {tagInput ? `${t.editor.createTag} "${tagInput}"` : t.editor.typeToCreateTag}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="editor-meta-field">
              <label className="editor-meta-label">{t.editor.visibility}</label>
              <div className="visibility-toggle">
                <button
                  className={`visibility-btn ${isPublic ? 'active' : ''}`}
                  onClick={() => setIsPublic(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {t.editor.public}
                </button>
                <button
                  className={`visibility-btn ${!isPublic ? 'active' : ''}`}
                  onClick={() => setIsPublic(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  {t.editor.private}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="upload-progress">
          <div className="upload-progress-text">{t.editor.uploading} {uploadProgress}%</div>
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DocEditor;
