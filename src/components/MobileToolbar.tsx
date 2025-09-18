import React, { useState, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Save, FolderOpen, Upload, Settings, ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { GroupDialog } from './GroupDialog';
import { SettingsPanel } from './SettingsPanel';
import { toast } from 'sonner@2.0.3';

export function MobileToolbar() {
  const {
    canvasName,
    groups,
    nodes,
    selectedNodeIds,
    exportCanvas,
    importCanvas,
    newCanvas,
    updateGroup,
  } = useCanvasStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [saveAsName, setSaveAsName] = useState(canvasName);
  const [exportFormat, setExportFormat] = useState<'json' | 'png' | 'jpeg' | 'pdf'>('json');
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setSaveAsName(canvasName); // Reset to current canvas name
    setSaveAsOpen(true);
  };

  const handleSaveAsConfirm = async () => {
    const filename = saveAsName.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (exportFormat === 'json') {
      const data = exportCanvas();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Canvas exported as JSON');
    } else {
      await handleCanvasExport(filename, exportFormat);
    }
    
    setSaveAsOpen(false);
  };

  const handleCanvasExport = async (filename: string, format: 'png' | 'jpeg' | 'pdf') => {
    try {
      // Find the canvas container element
      const canvasContainer = document.querySelector('[data-canvas-container]') || 
                             document.querySelector('div[style*="transform"]') ||
                             document.body;
      
      if (!canvasContainer) {
        toast.error('Canvas container not found');
        return;
      }

      // For now, we'll show a message about image export limitations
      // In a full implementation, you would use html2canvas or a similar library
      toast.info(`${format.toUpperCase()} export is being prepared. This feature will capture the visual canvas in a future update.`);
      
      // Create a simple fallback - export the JSON data with the chosen filename
      const data = exportCanvas();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_data.json`; // Indicate this is the data export
      a.click();
      URL.revokeObjectURL(url);
      
      // Note: To implement true visual export, you would need to:
      // 1. Install html2canvas or similar library
      // 2. Capture the canvas container as an image
      // 3. Convert to the desired format
      toast.success(`Data exported as JSON (Visual ${format.toUpperCase()} export coming soon)`);
      
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
      console.error('Export error:', error);
    }
  };

  const handleImport = () => {
    if (importData.trim()) {
      importCanvas(importData);
      setImportData('');
    }
  };

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content);
          importCanvas(content);
          toast.success(`Canvas imported from ${file.name}`);
        } catch (error) {
          toast.error('Invalid JSON file. Please select a valid canvas export file.');
        }
      };
      reader.readAsText(file);
    } else {
      toast.error('Please select a JSON file.');
    }
    
    event.target.value = '';
  };

  const handleEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveGroupName = (groupId: string) => {
    if (editingGroupName.trim()) {
      updateGroup(groupId, { name: editingGroupName.trim() });
      toast.success('Group name updated');
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
      {/* Save and Settings row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button onClick={handleExport} size="sm" variant="outline">
            <Save className="w-3 h-3" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <FolderOpen className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Load Canvas</DialogTitle>
                <DialogDescription>
                  Import a canvas by pasting JSON data or selecting a file.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste JSON data here..."
                  className="w-full h-24 p-2 border rounded resize-none text-xs"
                />
                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={!importData.trim()} size="sm">
                    Import
                  </Button>
                  <Button onClick={handleFileImport} variant="outline" size="sm">
                    <Upload className="w-3 h-3" />
                  </Button>
                  <Button onClick={newCanvas} variant="outline" size="sm">
                    New
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats and selection counter */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {selectedNodeIds.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {selectedNodeIds.length} selected
            </span>
          )}
          <span>{nodes.length} nodes</span>
        </div>

        <Button
          onClick={() => setSettingsOpen(true)}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* Collapsible Groups section */}
      <Collapsible open={groupsExpanded} onOpenChange={setGroupsExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors">
          {groupsExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span className="text-sm font-medium">GROUPS</span>
          <Badge variant="secondary" className="text-xs h-4 px-1 ml-auto">
            {groups.length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {groups.map(group => (
            <div key={group.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    className="text-xs h-6 px-1 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveGroupName(group.id);
                      if (e.key === 'Escape') handleCancelEditGroup();
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => handleSaveGroupName(group.id)}
                  >
                    <Check className="w-2 h-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={handleCancelEditGroup}
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </div>
              ) : (
                <>
                  <span 
                    className="text-xs truncate flex-1 cursor-pointer"
                    onClick={() => handleEditGroup(group)}
                  >
                    {group.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Edit2 className="w-2 h-2" />
                  </Button>
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    {group.nodes.length}
                  </Badge>
                </>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No groups created yet
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Hidden Group Dialog trigger for mobile action menu */}
      <GroupDialog
        trigger={
          <button 
            className="hidden"
            data-group-dialog-trigger
          />
        }
      />

      {/* Save As Dialog */}
      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save As</DialogTitle>
            <DialogDescription>
              Choose a name and format for your canvas export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="saveAsName">Canvas Name</Label>
              <Input
                id="saveAsName"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Enter canvas name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="exportFormat">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Data)</SelectItem>
                  <SelectItem value="png">PNG (Image)</SelectItem>
                  <SelectItem value="jpeg">JPEG (Image)</SelectItem>
                  <SelectItem value="pdf">PDF (Document)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveAsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAsConfirm}
                disabled={!saveAsName.trim()}
              >
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <SettingsPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}