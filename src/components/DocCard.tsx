import type React from 'react';
import { Link } from 'react-router-dom';
import type { DocList } from '@/types';
import { formatRelativeTime } from '@/utils/date';
import { useApp } from '@/contexts/useApp';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Calendar } from 'lucide-react';

interface DocCardProps {
  doc: DocList;
}

export const DocCard: React.FC<DocCardProps> = ({ doc }) => {
    const { t, language } = useApp();

    return (
        <Link to={`/docs/${doc.id}`} className="block group h-full">
            <Card className="gap-4 p-0 h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/40 flex flex-col backdrop-blur-sm">
                <CardHeader className="p-0">
                    <div className="relative aspect-5/3 bg-linear-to-br from-muted/50 to-muted overflow-hidden">
                        {doc.header_img ? (
                            <img
                                src={doc.header_img}
                                alt={doc.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                                <FileText className="h-10 w-10 stroke-[1.5]" />
                            </div>
                        )}
                        {!doc.is_public && (
                            <Badge variant="secondary" className="absolute top-2.5 right-2.5 gap-1 backdrop-blur-md bg-background/80 border-0 shadow-sm">
                                <Lock className="h-3 w-3" />
                                {t.editor.private}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pl-4 pr-4 flex-1 space-y-2.5">
                    <h3 className="font-medium text-base text-foreground/90 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
                        {doc.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 min-h-5">
                        {doc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal px-2 py-0 h-5 border-muted-foreground/20">
                                {tag}
                            </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal px-2 py-0 h-5 border-muted-foreground/20">
                +{doc.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-muted-foreground/70">
                    <span className="truncate max-w-[60%] font-medium">{doc.owner_nick_name || doc.owner}</span>
                    <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3 stroke-2" />
                        {formatRelativeTime(doc.created_at, language)}
                    </span>
                </CardFooter>
            </Card>
        </Link>
    );
};

export default DocCard;
