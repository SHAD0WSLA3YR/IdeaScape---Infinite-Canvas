import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Button } from './ui/button';
import { Undo, Redo } from 'lucide-react';

export function MobileUndoRedo() {
  const { undo, redo, history } = useCanvasStore();

  return (
    <>
      {/* Undo button - bottom left */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={undo}
          disabled={history.past.length === 0}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Undo className="w-5 h-5" />
        </Button>
      </div>

      {/* Redo button - bottom right */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={redo}
          disabled={history.future.length === 0}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Redo className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
}