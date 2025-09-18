import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface VideoMasonryProps {
  videos: string[];
  onVideosChange: (videos: string[]) => void;
  onDoubleClick?: () => void;
}

export function VideoMasonry({ videos, onVideosChange, onDoubleClick }: VideoMasonryProps) {
  const [dragOver, setDragOver] = useState(false);
  const [playingVideos, setPlayingVideos] = useState<{ [key: number]: boolean }>({});
  const [mutedVideos, setMutedVideos] = useState<{ [key: number]: boolean }>({});
  const [progress, setProgress] = useState<{ [key: number]: number }>({});
  const [duration, setDuration] = useState<{ [key: number]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      const newVideos = videoFiles.map(file => URL.createObjectURL(file));
      onVideosChange([...videos, ...newVideos]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length > 0) {
      const newVideos = videoFiles.map(file => URL.createObjectURL(file));
      onVideosChange([...videos, ...newVideos]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onVideosChange(newVideos);
    
    // Clean up object URL to prevent memory leaks
    if (videos[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(videos[index]);
    }
    
    // Clean up refs and state
    delete videoRefs.current[index];
    setPlayingVideos(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setMutedVideos(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setProgress(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setDuration(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (playingVideos[index]) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
    
    setPlayingVideos(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.muted = !video.muted;
    setMutedVideos(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleTimeUpdate = (index: number) => {
    const video = videoRefs.current[index];
    if (!video || !video.duration) return;

    const progressPercent = (video.currentTime / video.duration) * 100;
    setProgress(prev => ({
      ...prev,
      [index]: progressPercent
    }));
  };

  const handleLoadedMetadata = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    setDuration(prev => ({
      ...prev,
      [index]: video.duration
    }));
  };

  const handleSeek = (index: number, percent: number) => {
    const video = videoRefs.current[index];
    if (!video || !video.duration) return;

    video.currentTime = (percent / 100) * video.duration;
  };

  const resetVideo = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.currentTime = 0;
    if (playingVideos[index]) {
      video.pause();
      setPlayingVideos(prev => ({
        ...prev,
        [index]: false
      }));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openFullscreen = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div className="w-full h-full">
      {videos.length === 0 ? (
        <div
          className={`w-full h-full min-h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
            dragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onDoubleClick={onDoubleClick}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Drop videos here or click to upload
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Supports MP4, WebM, MOV, and other video formats
          </p>
        </div>
      ) : (
        <div
          className={`relative ${dragOver ? 'ring-2 ring-blue-400 ring-opacity-50 rounded-lg' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Container-based Responsive Grid Layout */}
          <div className="video-grid-container">
            <div className="video-grid">
              <AnimatePresence>
                {videos.map((video, index) => (
                  <motion.div
                    key={`${video}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="relative group video-item"
                  >
                    <div className="relative rounded-lg overflow-hidden bg-black shadow-lg border border-gray-200 dark:border-gray-700 aspect-video">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[index] = el;
                        }}
                        src={video}
                        className="w-full h-full object-contain"
                        style={{ 
                          backgroundColor: '#000'
                        }}
                        onTimeUpdate={() => handleTimeUpdate(index)}
                        onLoadedMetadata={() => handleLoadedMetadata(index)}
                        onEnded={() => setPlayingVideos(prev => ({ ...prev, [index]: false }))}
                        muted={mutedVideos[index] || false}
                        playsInline
                        preload="metadata"
                        controls={false}
                      />
                      
                      {/* Video Controls Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlay(index);
                            }}
                          >
                            {playingVideos[index] ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute(index);
                            }}
                          >
                            {mutedVideos[index] ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetVideo(index);
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFullscreen(index);
                            }}
                          >
                            <Maximize className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <div className="flex items-center gap-3 text-white text-sm">
                          <span className="font-mono text-xs min-w-[3rem]">
                            {formatTime(videoRefs.current[index]?.currentTime || 0)}
                          </span>
                          <div 
                            className="flex-1 cursor-pointer bg-white/20 rounded-full h-2 overflow-hidden hover:bg-white/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const percent = ((e.clientX - rect.left) / rect.width) * 100;
                              handleSeek(index, percent);
                            }}
                          >
                            <div 
                              className="h-full bg-white transition-all duration-100 rounded-full"
                              style={{ width: `${progress[index] || 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs min-w-[3rem] text-right">
                            {formatTime(duration[index] || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 shadow-lg rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveVideo(index);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Add more videos button */}
          <div className="mt-6">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add More Videos
            </Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}