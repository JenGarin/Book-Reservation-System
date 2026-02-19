import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Save, Clock, Calendar, AlertTriangle, Power, TrendingUp, Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const { config, updateConfig } = useApp();
  const [formData, setFormData] = useState(config);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isClearDataConfirmOpen, setIsClearDataConfirmOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handlePeakHourChange = (index: number, field: 'start' | 'end', value: string) => {
    const newPeakHours = [...(formData.peakHours || [])];
    if (!newPeakHours[index]) return;
    newPeakHours[index] = { ...newPeakHours[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      peakHours: newPeakHours
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    toast.success('System settings updated successfully');
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        users: JSON.parse(localStorage.getItem('ventra_users') || '[]'),
        courts: JSON.parse(localStorage.getItem('ventra_courts') || '[]'),
        bookings: JSON.parse(localStorage.getItem('ventra_bookings') || '[]'),
        memberships: JSON.parse(localStorage.getItem('ventra_memberships') || '[]'),
        subscriptions: JSON.parse(localStorage.getItem('ventra_subscriptions') || '[]'),
        notifications: JSON.parse(localStorage.getItem('ventra_notifications') || '[]'),
        auth: JSON.parse(localStorage.getItem('ventra_auth') || '{}'),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `ventra-backup-${new Date().toISOString().split('T')[0]}.json`;

      link.click();
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("An error occurred while exporting data.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToImport(file);
      setIsImportConfirmOpen(true);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!fileToImport) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const data = JSON.parse(text);

        const requiredKeys = ['users', 'courts', 'bookings', 'memberships', 'auth'];
        const hasRequiredKeys = requiredKeys.every(key => key in data);
        if (!hasRequiredKeys) {
          toast.error("Invalid backup file. Missing required data sections.");
          return;
        }

        Object.keys(data).forEach(key => {
          const storageKey = `ventra_${key}`;
          localStorage.setItem(storageKey, JSON.stringify(data[key]));
        });

        toast.success("Data imported successfully! The application will now reload.", {
          duration: 4000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error("Failed to import data:", error);
        toast.error("Failed to parse or import data. Please check the file format.");
      }
    };
    reader.readAsText(fileToImport);
    setIsImportConfirmOpen(false);
  };

  const handleConfirmClearData = () => {
    localStorage.clear();
    toast.success("All data cleared. The application will now reload.", {
      duration: 4000,
    });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    setIsClearDataConfirmOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure global facility rules and operational parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Operational Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Operational Hours
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opening Time</label>
              <input
                type="time"
                name="openingTime"
                value={formData.openingTime}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Closing Time</label>
              <input
                type="time"
                name="closingTime"
                value={formData.closingTime}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Booking Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Booking Rules
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Booking Interval (minutes)</label>
              <input
                type="number"
                name="bookingInterval"
                value={formData.bookingInterval}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Duration of each booking slot.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Buffer Time (minutes)</label>
              <input
                type="number"
                name="bufferTime"
                value={formData.bufferTime}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Time between consecutive bookings.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Booking Duration (minutes)</label>
              <input
                type="number"
                name="maxBookingDuration"
                value={formData.maxBookingDuration}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Advance Booking Limit (days)</label>
              <input
                type="number"
                name="advanceBookingDays"
                value={formData.advanceBookingDays}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Peak Hour Rules
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Define time ranges where peak pricing applies.</p>
            {formData.peakHours?.map((peak, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={peak.start}
                    onChange={(e) => handlePeakHourChange(index, 'start', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={peak.end}
                    onChange={(e) => handlePeakHourChange(index, 'end', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-teal-600" />
            Cancellation Policy
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cancellation Cutoff (hours)</label>
            <input
              type="number"
              name="cancellationCutoffHours"
              value={formData.cancellationCutoffHours}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum hours before booking time to allow cancellation without penalty.</p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Power className="w-5 h-5 text-teal-600" />
            System Status
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maintenance Mode</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enable to prevent new bookings and show a maintenance message to users.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="maintenanceMode"
                checked={!!(formData as any).maintenanceMode} 
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Download className="w-5 h-5 text-teal-600" />
            Data Management
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Export all application data to a single JSON file. This is useful for backups or migrating to another system.</p>
              <button
                type="button"
                onClick={handleExportData}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Export Data
              </button>
            </div>
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Import data from a JSON file. This will <span className="font-bold text-red-500">overwrite all existing data</span>.</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                  accept="application/json"
                />
                <button
                    type="button"
                    onClick={handleImportClick}
                    className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                    <Upload size={18} />
                    Import Data
                </button>
            </div>
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Clear all application data. This will <span className="font-bold text-red-500">permanently delete all data</span> and reset the application.</p>
                <button
                    type="button"
                    onClick={() => setIsClearDataConfirmOpen(true)}
                    className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                >
                    <Trash2 size={18} />
                    Clear All Data
                </button>
            </div>
          </div>
        </div>

        {isImportConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Import Data</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to import <span className="font-bold text-slate-600 dark:text-slate-300">{fileToImport?.name}</span>? 
                This will <span className="font-bold text-red-500">overwrite all current data</span> in the application. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsImportConfirmOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  Import & Overwrite
                </button>
              </div>
            </div>
          </div>
        )}

        {isClearDataConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Clear All Data</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to clear all data? This action cannot be undone and will reset the application to its initial state.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsClearDataConfirmOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmClearData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100 dark:shadow-none flex items-center gap-2"
          >
            <Save size={20} />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}