import React, { useState, useRef, useCallback } from 'react';
import Masonry from 'react-responsive-masonry';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { X } from 'lucide-react';

interface ImageMasonryProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    nodeWidth?: number;
}

export function ImageMasonry({ images, onImagesChange, nodeWidth = 200 }: ImageMasonryProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList) => {
        const newImages: string[] = [];
        let processedCount = 0;
        const totalFiles = Array.from(files).filter(file => file.type.startsWith('image/')).length;
        
        if (totalFiles === 0) return;
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        newImages.push(e.target.result as string);
                        processedCount++;
                        
                        // When all files are processed, update the images array
                        if (processedCount === totalFiles) {
                            onImagesChange([...images, ...newImages]);
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }, [images, onImagesChange]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const removeImage = useCallback((index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    }, [images, onImagesChange]);

    // Calculate columns based on node width
    const getColumnsCount = useCallback(() => {
        // Base columns calculation with width breakpoints
        if (nodeWidth >= 600) return 5;  // 5 columns for very wide nodes
        if (nodeWidth >= 480) return 4;  // 4 columns for wide nodes  
        if (nodeWidth >= 360) return 3;  // 3 columns for medium nodes
        if (nodeWidth >= 240) return 2;  // 2 columns for small-medium nodes
        return 1; // 1 column for narrow nodes
    }, [nodeWidth]);

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    if (images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 w-full h-full flex flex-col items-center justify-center transition-colors ${
                        dragActive 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={(e) => {
                        e.stopPropagation();
                        onButtonClick();
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                    />
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            Drag and drop images here
                        </p>
                        <p className="text-xs text-gray-400">
                            or click to select files
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2 overflow-auto">
            <div
                className={`relative ${
                    dragActive ? 'bg-blue-50 border-2 border-dashed border-blue-400 rounded' : ''
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                />
                
                <Masonry columnsCount={getColumnsCount()} gutter="8px">
                    {images.map((image, index) => (
                        <div key={index} className="relative group mb-2">
                            <ImageWithFallback
                                src={image}
                                alt={`Image ${index + 1}`}
                                className="w-full h-auto rounded shadow-sm"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </Masonry>
                
                {/* Add more images button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onButtonClick();
                    }}
                    className="mt-2 w-full py-2 pl-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                    + Add more images
                </button>
            </div>
        </div>
    );
}