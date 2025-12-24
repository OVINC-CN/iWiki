import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { getDocDetail, createDoc, updateDoc, getTags } from '../api';
import { useApp } from '../contexts/useApp';
import { uploadImageToCOS } from '../utils/cos';
import { Loading } from '../components/Loading';
import type { TagInfo, EditDocRequest } from '../types';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import '../styles/editor.css';
import '../styles/docDetail.css';

export const DocEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          setTags(doc.tags.map((t) => t.name));
        } catch {
          navigate('/docs');
        } finally {
          setLoading(false);
        }
      };
      fetchDoc();
    }
  }, [id, isEditing, navigate]);

  // Load all tags for suggestions
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await getTags({ size: 100 });
        setAllTags(response.data.data.results);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入文章内容');
      return;
    }

    try {
      setSaving(true);
      const data: EditDocRequest = {
        title: title.trim(),
        content,
        header_img: headerImg || null,
        is_public: isPublic,
        tags,
      };

      if (isEditing && id) {
        await updateDoc(id, data);
        navigate(`/docs/${id}`);
      } else {
        const response = await createDoc(data);
        navigate(`/docs/${response.data.data.id}`);
      }
    } catch {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [title, content, headerImg, isPublic, tags, isEditing, id, navigate]);

  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!canUpload) {
      alert('您没有上传图片的权限');
      return;
    }

    try {
      setUploadProgress(0);
      const url = await uploadImageToCOS(file, setUploadProgress);
      
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
      alert('图片上传失败');
    } finally {
      setUploadProgress(null);
    }
  }, [canUpload, content]);

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

  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
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
    return <Loading fullPage text="加载中..." />;
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
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="editor-header-right">
          <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : isEditing ? '更新' : '发布'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-toolbar">
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" title="粗体" onClick={() => insertMarkdown('**', '**')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button className="toolbar-btn" title="斜体" onClick={() => insertMarkdown('*', '*')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <button className="toolbar-btn" title="删除线" onClick={() => insertMarkdown('~~', '~~')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4H9a3 3 0 00-3 3v1a3 3 0 003 3h6" />
                <path d="M8 20h7a3 3 0 003-3v-1a3 3 0 00-3-3H8" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" title="标题" onClick={() => insertMarkdown('## ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h8M4 6v12M12 6v12M20 8l-4 4 4 4" />
              </svg>
            </button>
            <button className="toolbar-btn" title="引用" onClick={() => insertMarkdown('> ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" title="代码" onClick={() => insertMarkdown('`', '`')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button className="toolbar-btn" title="代码块" onClick={() => insertMarkdown('```\n', '\n```')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <polyline points="9 9 5 12 9 15" />
                <polyline points="15 9 19 12 15 15" />
              </svg>
            </button>
            <button className="toolbar-btn" title="链接" onClick={() => insertMarkdown('[', '](url)')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
          <div className="editor-toolbar-divider" />
          <div className="editor-toolbar-group">
            <button className="toolbar-btn" title="无序列表" onClick={() => insertMarkdown('- ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
            <button className="toolbar-btn" title="有序列表" onClick={() => insertMarkdown('1. ')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </button>
            <button className="toolbar-btn" title="任务列表" onClick={() => insertMarkdown('- [ ] ')}>
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
            <button className="toolbar-btn" title="数学公式" onClick={() => insertMarkdown('$', '$')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <text x="6" y="18" fontSize="16" fontStyle="italic">∑</text>
              </svg>
            </button>
            <button className="toolbar-btn" title="Mermaid图表" onClick={() => insertMarkdown('```mermaid\ngraph TD\n  A --> B\n', '\n```')}>
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

        <div className="editor-main">
          <div className="editor-pane">
            <div className="editor-pane-header">编辑</div>
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              placeholder="开始写作..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            />
          </div>
          <div className="editor-pane editor-preview">
            <div className="editor-pane-header">预览</div>
            <div className="doc-detail-content" style={{ padding: '1.5rem' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
              >
                {content || '*开始输入内容查看预览...*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="editor-meta">
          <div className="editor-meta-row">
            <div className="editor-meta-field">
              <label className="editor-meta-label">头图 URL</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={headerImg}
                onChange={(e) => setHeaderImg(e.target.value)}
              />
            </div>
            <div className="editor-meta-field">
              <label className="editor-meta-label">标签</label>
              <div className="editor-tags-input">
                {tags.map((tag) => (
                  <span key={tag} className="editor-tag">
                    {tag}
                    <button className="editor-tag-remove" onClick={() => handleRemoveTag(tag)}>
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="输入标签后按回车..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  list="tag-suggestions"
                />
                <datalist id="tag-suggestions">
                  {allTags.filter((t) => !tags.includes(t.name)).map((tag) => (
                    <option key={tag.id} value={tag.name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="editor-meta-field">
              <label className="editor-meta-label">可见性</label>
              <label className="editor-checkbox">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>公开文章</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="upload-progress">
          <div className="upload-progress-text">上传中... {uploadProgress}%</div>
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DocEditor;
