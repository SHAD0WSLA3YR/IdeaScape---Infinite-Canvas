import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useCanvasStore } from '../store/canvasStore';

interface GroupDialogProps {
    trigger: React.ReactNode;
    nodeIds?: string[]; // Optional: if provided, nodes will be assigned to the group
    onSuccess?: () => void;
}

export function GroupDialog({ trigger, nodeIds = [], onSuccess }: GroupDialogProps) {
    const { addGroup } = useCanvasStore();
    const [open, setOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

    // Listen for close all dialogs event
    useEffect(() => {
        const handleCloseAllDialogs = () => {
            setOpen(false);
        };

        window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
        return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
    }, []);

    const groupColors = [
        '#3b82f6', '#f97316', '#10b981', '#ef4444', 
        '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'
    ];

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            addGroup(newGroupName, newGroupColor, nodeIds);
            setNewGroupName('');
            setNewGroupColor('#3b82f6');
            setOpen(false);
            onSuccess?.();
        }
    };

    const handleClose = () => {
        setOpen(false);
        setNewGroupName('');
        setNewGroupColor('#3b82f6');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {trigger}
            </DialogTrigger>
            <DialogContent 
                onClick={(e) => e.stopPropagation()} 
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                    // Prevent dialog from closing when clicking inside it
                    if (e.target && (e.target as HTMLElement).closest('[data-slot="dialog-content"]')) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                        Create a new group to organize and color-code your nodes.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Group name..."
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter' && newGroupName.trim()) {
                                e.preventDefault();
                                handleAddGroup();
                            }
                        }}
                        autoFocus
                    />
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {groupColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNewGroupColor(color);
                                    }}
                                    className={`w-8 h-8 rounded border-2 transition-all ${
                                        newGroupColor === color 
                                            ? 'border-gray-800 scale-110' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddGroup();
                            }} 
                            disabled={!newGroupName.trim()}
                            className="flex-1"
                        >
                            Create Group
                        </Button>
                        <Button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }} 
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}