import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { getDocDetail, deleteDoc } from '@/api';
import { useApp } from '@/contexts/useApp';
import { useModal } from '@/contexts/useModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading } from '@/components/Loading';
import { CodeBlock, PreBlock } from '@/components/CodeBlock';
import { ImagePreview } from '@/components/ImagePreview';
import { formatDate } from '@/utils/date';
import { docEditPath } from '@/routes';
import type { DocInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Lock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

export const DocDetail: React.FC<{ id: string }> = ({ id }) => {
    const navigate = useNavigate();
    const { user } = useApp();
    const { showAlert } = useModal();

    const [doc, setDoc] = useState<DocInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useDocumentTitle(doc?.title);

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                setLoading(true);
                const response = await getDocDetail(id);
                setDoc(response.data.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '加载失败');
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [id]);

    const handleDelete = useCallback(async () => {
        try {
            setDeleting(true);
            await deleteDoc(id);
            navigate('/docs');
        } catch {
            showAlert('删除失败');
        } finally {
            setDeleting(false);
        }
    }, [id, navigate, showAlert]);

    if (loading) {
        return <Loading fullPage text="加载中..." />;
    }

    if (error || !doc) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">{error || '文章不存在'}</h3>
                    <Button asChild className="mt-4">
                        <Link to="/docs">返回列表</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isOwner = user?.username === doc.owner;

    return (
        <motion.article
            className="container mx-auto px-4 py-8 max-w-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Button asChild variant="ghost" size="sm" className="mb-6">
                <Link to="/docs" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    返回列表
                </Link>
            </Button>

            <header className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground flex-1">{doc.title}</h1>
                    {!doc.is_public && (
                        <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            私密
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{doc.owner_nick_name || doc.owner}</span>
                        <span>{formatDate(doc.created_at)}</span>
                    </div>

                    {isOwner && (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={docEditPath(id)} className="gap-1">
                                    <Pencil className="h-4 w-4" />
                                    编辑
                                </Link>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={deleting}
                                        className="text-destructive hover:text-destructive gap-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {deleting ? '删除中...' : '删除'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            此操作无法撤销，文章将被永久删除。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            删除
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </header>

            {doc.header_img && (
                <img
                    src={doc.header_img}
                    alt={doc.title}
                    className="w-full max-h-96 object-cover rounded-lg mb-8"
                />
            )}

            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                    components={{ code: CodeBlock, pre: PreBlock, img: ImagePreview }}
                >
                    {doc.content}
                </ReactMarkdown>
            </div>
        </motion.article>
    );
};

export default DocDetail;
