import { useEffect } from 'react';

export const useDocumentTitle = (title: string | undefined) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | iWiki`;
        }

        return () => {
            document.title = 'iWiki';
        };
    }, [title]);
};
