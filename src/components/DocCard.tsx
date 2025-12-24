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
  const { t } = useApp();

  return (
    <Link to={`/docs/${doc.id}`} className="block group h-full">
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 flex flex-col">
        <CardHeader className="p-0">
          <div className="relative aspect-video bg-muted overflow-hidden">
            {doc.header_img ? (
              <img
                src={doc.header_img}
                alt={doc.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12" />
              </div>
            )}
            {!doc.is_public && (
              <Badge variant="secondary" className="absolute top-2 right-2 gap-1">
                <Lock className="h-3 w-3" />
                {t.editor.private}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {doc.title}
          </h3>
          <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
            {doc.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {doc.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{doc.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between text-sm text-muted-foreground">
          <span>{doc.owner_nick_name || doc.owner}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatRelativeTime(doc.created_at)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default DocCard;
