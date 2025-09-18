import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface MobileRichTextEditorProps {
  isVisible: boolean;
  onFormat: (command: string, value?: string) => void;
  onClose: () => void;
}

export function MobileRichTextEditor({ isVisible, onFormat, onClose }: MobileRichTextEditorProps) {
  const formatButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50"
        >
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex gap-2">
              {formatButtons.map((button) => (
                <Button
                  key={button.command}
                  onClick={() => onFormat(button.command)}
                  size="sm"
                  variant="outline"
                  className="h-10 w-10 p-0"
                  title={button.title}
                >
                  <button.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
            >
              Done
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}