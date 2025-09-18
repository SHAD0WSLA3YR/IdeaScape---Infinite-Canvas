import React, { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Save, FolderOpen, Plus, Palette, Undo, Redo, Upload, Settings, Search, Edit2, Check, X, Zap, Users } from 'lucide-react';
import { GroupDialog } from './GroupDialog';
import { SettingsPanel } from './SettingsPanel';
import { NodeSearchDialog } from './NodeSearchDialog';
import { CollaborationPanel } from './CollaborationPanel';

import { toast } from 'sonner@2.0.3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function Toolbar() {
  const {
    canvasName,
    groups,
    nodes,
    connections,
    selectedNodeId,
    selectedNodeIds,
    exportCanvas,
    importCanvas,
    newCanvas,
    updateGroup,
    undo,
    redo,
    history,
    autoOrganizeNodes
  } = useCanvasStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [saveAsName, setSaveAsName] = useState(canvasName);
  const [exportFormat, setExportFormat] = useState<'json' | 'png' | 'jpeg' | 'pdf'>('json');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for close all dialogs event
  useEffect(() => {
    const handleCloseAllDialogs = () => {
      setSettingsOpen(false);
      setSaveAsOpen(false);
      setCollaborationOpen(false);
      setSearchOpen(false);
    };

    window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
    return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
  }, []);

  const handleExport = () => {
    setSaveAsName(canvasName); // Pre-fill with current canvas name
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
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON data backup saved to Downloads folder!', {
        description: `File: ${filename}.json`
      });
    } else {
      await handleCanvasExport(filename, exportFormat);
    }
    
    setSaveAsOpen(false);
  };

  const handleCanvasExport = async (filename: string, format: 'png' | 'jpeg' | 'pdf') => {
    try {
      toast.info(`Preparing ${format.toUpperCase()} export...`, { 
        duration: 2000,
        description: 'This may take a few seconds...'
      });
      
      // Find the canvas container
      const canvasContainer = document.querySelector('[data-infinite-canvas]') as HTMLElement;
      if (!canvasContainer) {
        throw new Error('Canvas container not found');
      }
      
      // Get current viewport to restore later
      const { transform, fitToScreen, setTransform } = useCanvasStore.getState();
      const originalTransform = { ...transform };
      
      // For PNG/JPEG screenshots, hide all UI elements and fit to screen
      let uiElements: HTMLElement[] = [];
      if (format === 'png' || format === 'jpeg') {
        // Find all UI elements to hide
        const selectors = [
          '.absolute.top-4.right-4', // Desktop Toolbar
          '.absolute.top-4.left-4', // EditableTitle
          '.fixed.bottom-4.left-4', // HelpPanel
          '.fixed.top-4.left-4', // Mobile Toolbar
          '.fixed.bottom-4.right-4', // Mobile Action Menu
          '.fixed.bottom-4.left-4', // Mobile Undo/Redo
          '.fixed.bottom-16.right-4', // Any other mobile elements
          '.fixed', // Catch any other fixed positioned elements
          '[data-sonner-toaster]' // Toast notifications
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
          elements.forEach(element => {
            // Skip the canvas container itself
            if (!element.contains(canvasContainer) && element !== canvasContainer) {
              uiElements.push(element);
              element.style.opacity = '0';
              element.style.pointerEvents = 'none';
            }
          });
        });
        
        // Wait for UI to hide
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Fit to screen for export
      const canvasRect = canvasContainer.getBoundingClientRect();
      fitToScreen({ width: canvasRect.width, height: canvasRect.height });
      
      // Wait for the fit-to-screen to complete
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Debug: Log canvas container info
      console.log('Canvas container found:', canvasContainer);
      console.log('Canvas container dimensions:', {
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight
      });
      
      // Capture the canvas with clean options for screenshot
      const canvas = await html2canvas(canvasContainer, {
        backgroundColor: '#f3f4f6',
        scale: 1.5, // Slightly lower scale for better compatibility
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        removeContainer: false,
        logging: false, // Reduce console noise
        onclone: (clonedDoc) => {
          // Remove any remaining UI elements from the cloned document
          const uiSelectors = [
            '.fixed', '.absolute', '[data-sonner-toaster]', 
            '.z-50', '.z-40', '.z-30', '.pointer-events-none'
          ];
          uiSelectors.forEach(selector => {
            const elements = clonedDoc.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
        },
        ignoreElements: (element) => {
          // Skip problematic elements and any remaining UI
          const classList = element.classList;
          return classList.contains('pointer-events-none') || 
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE' ||
                 element.hasAttribute('data-sonner-toaster') ||
                 classList.contains('fixed') ||
                 classList.contains('absolute') ||
                 classList.contains('z-50') ||
                 classList.contains('z-40');
        }
      });
      
      // Debug: Log canvas capture info
      console.log('Canvas captured:', {
        width: canvas.width,
        height: canvas.height,
        hasData: canvas.toDataURL().length > 1000
      });
      
      // Restore original transform
      setTransform(originalTransform);
      
      // Restore UI elements visibility
      if (format === 'png' || format === 'jpeg') {
        uiElements.forEach(element => {
          element.style.opacity = '';
          element.style.pointerEvents = '';
        });
      }
      
      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate PDF dimensions (A4 aspect ratio)
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pdfWidth, Math.min(pdfHeight, 297)], // Max A4 height
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
        pdf.save(`${filename}.pdf`);
        toast.success(`PDF document saved to Downloads folder!`, {
          description: `File: ${filename}.pdf`
        });
        return; // Return early to avoid the generic success message
      } else {
        // Export as PNG or JPEG
        const quality = format === 'jpeg' ? 0.95 : 1;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        
        // Create download function with multiple fallback methods
        const downloadImage = (dataUrl: string) => {
          try {
            // Method 1: Standard download link approach
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${filename}.${format}`;
            a.style.display = 'none';
            
            // Add to DOM
            document.body.appendChild(a);
            
            // Try different click methods for better browser compatibility
            try {
              // Method 1a: Standard click
              a.click();
            } catch (clickError) {
              // Method 1b: Dispatch click event
              const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              });
              a.dispatchEvent(clickEvent);
            }
            
            // Clean up after delay
            setTimeout(() => {
              try {
                document.body.removeChild(a);
                if (dataUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(dataUrl);
                }
              } catch (cleanupError) {
                console.warn('Cleanup failed:', cleanupError);
              }
            }, 1000);
            
            // Try opening in new window as fallback (user can right-click save)
            setTimeout(() => {
              try {
                const newWindow = window.open(dataUrl, '_blank');
                if (!newWindow) {
                  // If popup blocked, show instructions
                  toast.warning('Download may be blocked by popup blocker', {
                    description: 'Right-click the image and select "Save image as..." to download manually.',
                    duration: 8000
                  });
                }
              } catch (windowError) {
                console.warn('Popup fallback failed:', windowError);
              }
            }, 2000);
            
            return true;
          } catch (downloadError) {
            console.error('Download failed:', downloadError);
            // Final fallback: try to open the data URL directly
            try {
              window.open(dataUrl, '_blank');
              toast.info('Download failed, opened in new tab', {
                description: 'Right-click the image and select "Save image as..." to download.',
                duration: 8000
              });
              return true;
            } catch (finalError) {
              console.error('All download methods failed:', finalError);
              return false;
            }
          }
        };

        try {
          // First try blob method for better file handling
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`✅ Blob created successfully: ${blob.size} bytes`);
              const url = URL.createObjectURL(blob);
              console.log(`✅ Blob URL created: ${url.substring(0, 50)}...`);
              
              const success = downloadImage(url);
              console.log(`${success ? '✅' : '❌'} Download attempt completed`);
              
              if (!success) {
                console.error('❌ All download methods failed');
                toast.error('Download failed. Please try again or check browser settings.', {
                  description: 'Your browser may be blocking downloads. Check security settings.',
                  duration: 8000
                });
              }
            } else {
              console.warn('⚠️ Blob creation failed, trying dataURL method');
              const dataUrl = canvas.toDataURL(mimeType, quality);
              console.log(`✅ DataURL created: ${dataUrl.length} characters`);
              downloadImage(dataUrl);
            }
          }, mimeType, quality);
        } catch (blobError) {
          console.warn('⚠️ Blob method failed, using dataURL fallback:', blobError);
          const dataUrl = canvas.toDataURL(mimeType, quality);
          console.log(`✅ DataURL fallback created: ${dataUrl.length} characters`);
          downloadImage(dataUrl);
        }
      }
      
      if (format === 'png' || format === 'jpeg') {
        toast.success(`${format.toUpperCase()} export completed!`, {
          description: `File: ${filename}.${format} - Check your Downloads folder`,
          duration: 5000,
          action: {
            label: 'Need Help?',
            onClick: () => {
              toast.info('Download Troubleshooting', {
                description: 'If the download didn\'t start: 1) Check Downloads folder 2) Allow downloads in browser settings 3) Disable popup blockers',
                duration: 10000
              });
            }
          }
        });
        
        // Show additional help after a delay
        setTimeout(() => {
          const hasUserInteracted = document.hasFocus();
          if (hasUserInteracted) {
            toast.info('💡 Download Tip', {
              description: 'If downloads are blocked, we\'ll open the image in a new tab. Right-click and "Save image as..."',
              duration: 6000
            });
          }
        }, 4000);
      } else {
        toast.success(`Canvas exported as ${format.toUpperCase()}`);
      }
      
    } catch (error) {
      console.error('Canvas export failed:', error);
      
      // Restore UI elements if they were hidden
      if (format === 'png' || format === 'jpeg') {
        const selectors = [
          '.absolute.top-4.right-4',
          '.absolute.top-4.left-4', 
          '.fixed.bottom-4.left-4',
          '.fixed.top-4.left-4',
          '.fixed.bottom-4.right-4',
          '.fixed.bottom-4.left-4',
          '.fixed.bottom-16.right-4',
          '.fixed',
          '[data-sonner-toaster]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
          elements.forEach(element => {
            element.style.opacity = '';
            element.style.pointerEvents = '';
          });
        });
      }
      
      toast.error(`Visual export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSaveAsOpen(false); // Close the dialog on failure
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
          // Validate it's valid JSON
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
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleGroupHighlight = (groupId: string) => {
    // Trigger group highlight effect
    const event = new CustomEvent('highlightGroup', { detail: { groupId } });
    window.dispatchEvent(event);
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
    <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      {/* Canvas controls */}
      <div className="flex gap-2">
        <Button
          onClick={undo}
          disabled={history.past.length === 0}
          size="sm"
          variant="outline"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={redo}
          disabled={history.future.length === 0}
          size="sm"
          variant="outline"
        >
          <Redo className="w-4 h-4" />
        </Button>



        <Button onClick={handleExport} size="sm" variant="outline">
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>

        {/* Auto-Organize button - only show when nodes are selected */}
        {(selectedNodeIds.length > 0 || selectedNodeId) && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={autoOrganizeNodes}
            title="Organize selected nodes using force-directed layout"
          >
            <Zap className="w-4 h-4 mr-1" />
            Auto-Organize
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <FolderOpen className="w-4 h-4 mr-1" />
              Load
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Canvas</DialogTitle>
              <DialogDescription>
                Import a canvas by pasting JSON data or selecting a file from your computer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste JSON data here..."
                className="w-full h-32 p-2 border rounded resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={!importData.trim()}>
                  Import JSON
                </Button>
                <Button onClick={handleFileImport} variant="outline">
                  <Upload className="w-4 h-4 mr-1" />
                  From Computer
                </Button>
                <Button onClick={newCanvas} variant="outline">
                  New Canvas
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

      {/* Groups section */}
      <div className="border-t pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium">Groups</span>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {groups.map(group => (
            <div key={group.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    className="text-sm h-6 px-1 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveGroupName(group.id);
                      if (e.key === 'Escape') handleCancelEditGroup();
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleSaveGroupName(group.id)}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleCancelEditGroup}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span 
                    className="text-sm truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleGroupHighlight(group.id)}
                    title="Click to highlight group nodes"
                  >
                    {group.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={() => handleEditGroup(group)}
                    title="Edit group name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {group.nodes.length}
                  </Badge>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new group */}
        <GroupDialog
          trigger={
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full mt-2"
              data-group-dialog-trigger
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Group
            </Button>
          }
        />
      </div>

      {/* Stats and Settings */}
      <div className="border-t pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[rgba(125,123,155,1)]">{nodes.length} nodes</span>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <Button
            onClick={() => setSearchOpen(true)}
            size="sm"
            variant="outline"
            className="h-6 px-2 py-1"
            title="Search Nodes"
          >
            <Search className="w-3 h-3 mr-1" />
            <span className="text-xs">Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {selectedNodeIds.length > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {selectedNodeIds.length} selected
            </span>
          )}
          <Button
            onClick={() => setCollaborationOpen(true)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title="Real-time Collaboration"
          >
            <Users className="w-3 h-3" />
          </Button>
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
      </div>

      {/* Save As Dialog */}
      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save As</DialogTitle>
            <DialogDescription>
              Choose a name and format for your canvas export. PNG/JPEG formats create clean screenshots by hiding UI elements and fitting content to screen.
              <br /><br />
              <strong>Download troubleshooting:</strong>
              <br />• Check your Downloads folder (files save automatically)
              <br />• Enable downloads in browser settings if blocked
              <br />• If popup blockers interfere, we'll open images in new tabs for manual saving
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
                  <SelectItem value="json">JSON (Data Backup)</SelectItem>
                  <SelectItem value="png" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-400">PNG (High Quality Image)</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 ml-2">
                        Coming Soon
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="jpeg" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-400">JPEG (Compressed Image)</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 ml-2">
                        Coming Soon
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-400">PDF (Document)</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 ml-2">
                        Coming Soon
                      </Badge>
                    </div>
                  </SelectItem>
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

      {/* Node Search Dialog */}
      <NodeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <SettingsPanel />
        </DialogContent>
      </Dialog>

      {/* Collaboration Panel */}
      <CollaborationPanel
        isOpen={collaborationOpen}
        onClose={() => setCollaborationOpen(false)}
        canvasData={{ nodes, connections, groups }}
      />

    </div>
  );
}