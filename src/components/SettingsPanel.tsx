import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings, User, Palette, Monitor, Sun, Moon, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { toast } from 'sonner@2.0.3';

export function SettingsPanel() {
  const { settings, updateSettings, setTheme } = useCanvasStore();
  
  const [tempProfile, setTempProfile] = useState({
    username: settings.profile.username,
    email: settings.profile.email,
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleProfileSave = () => {
    updateSettings({
      profile: tempProfile
    });
    toast.success('Profile updated successfully');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> }
  ];

  const getCurrentThemeIcon = () => {
    const theme = themeOptions.find(t => t.value === settings.theme);
    return theme?.icon || <Monitor className="w-4 h-4" />;
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </DialogTitle>
        <DialogDescription>
          Customize your mind mapping experience
        </DialogDescription>
      </DialogHeader>

          <div className="space-y-6">
            {/* Theme Settings Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Palette className="w-3 h-3 text-blue-600" />
                </div>
                Appearance
              </h3>
              <div className="space-y-3 ml-8">
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select value={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select theme">
                        <div className="flex items-center gap-2">
                          {getCurrentThemeIcon()}
                          <span className="capitalize">{settings.theme}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {settings.theme === 'system' 
                      ? 'Automatically matches your device\'s theme preference'
                      : `Always use ${settings.theme} theme`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Settings Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-green-600" />
                </div>
                Profile
              </h3>
              <div className="space-y-4 ml-8">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={tempProfile.username}
                    onChange={(e) => setTempProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="w-full"
                  />
                </div>
                
                <Button 
                  onClick={handleProfileSave}
                  className="w-full flex items-center gap-2"
                  disabled={tempProfile.username === settings.profile.username && tempProfile.email === settings.profile.email}
                >
                  <Save className="w-4 h-4" />
                  Save Profile
                </Button>
              </div>
            </div>

            {/* Canvas Info Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Settings className="w-3 h-3 text-purple-600" />
                </div>
                Current Session
              </h3>
              <div className="space-y-2 ml-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Theme Active:</span>
                  <Badge variant="outline" className="text-xs">
                    {settings.theme === 'system' 
                      ? `System (${document.documentElement.classList.contains('dark') ? 'Dark' : 'Light'})`
                      : settings.theme
                    }
                  </Badge>
                </div>
                {settings.profile.username && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Signed in as:</span>
                    <Badge variant="outline" className="text-xs">
                      {settings.profile.username}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p><strong>Note:</strong> All settings are automatically saved and synced with your canvas data. Theme preferences apply immediately.</p>
          </div>
    </>
  );
}

