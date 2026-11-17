import React, { useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';

interface ImagePreviewProps {
    src?: string;
    alt?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, ...props }) => {
    const [open, setOpen] = useState(false);
    const [scale, setScale] = useState(1);

    const handleZoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
    }, []);

    const handleReset = useCallback(() => {
        setScale(1);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
        setScale(1);
    }, []);

    if (!src) {
        return null;
    }

    return (
        <>
            <img
                src={src}
                alt={alt || ''}
                className="cursor-zoom-in rounded-lg transition-transform hover:scale-[1.02]"
                onClick={() => setOpen(true)}
                {...props}
            />
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogPortal>
                    <DialogOverlay className="bg-black/80" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={handleZoomOut}
                            >
                                <ZoomOut className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={handleReset}
                            >
                                <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={handleZoomIn}
                            >
                                <ZoomIn className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={handleClose}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div
                            className="max-w-[90vw] max-h-[90vh] overflow-auto"
                            onClick={handleClose}
                        >
                            <img
                                src={src}
                                alt={alt || ''}
                                className="max-w-none transition-transform duration-200"
                                style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </DialogPortal>
            </Dialog>
        </>
    );
};

export default ImagePreview;
