import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { MessageCircle } from 'lucide-react';
import { ChatDialog } from './ChatDialog';

export function DesktopChatButton() {
  const [chatOpen, setChatOpen] = useState(false);

  // Listen for close all dialogs event
  useEffect(() => {
    const handleCloseAllDialogs = () => {
      setChatOpen(false);
    };

    window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
    return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
  }, []);

  return (
    <>
      <div className="fixed bottom-20 right-6 z-40">
        <Button
          onClick={() => setChatOpen(true)}
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
          title="Chat with AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
      
      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}