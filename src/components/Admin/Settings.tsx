import React, { useState } from 'react';
import { Building2, Save, Store, Upload } from 'lucide-react';
import {
  getBusinessSettings,
  saveBusinessSettings,
  type BusinessSettings,
  type RestaurantBusinessType,
} from '../../lib/businessSettings';

const BUSINESS_TYPE_LABELS: Record<RestaurantBusinessType, string> = {
  full_service: 'Full Service',
  fast_casual: 'Fast-Casual',
  quick_serve: 'Quick-Serve',
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read logo file.'));
    reader.readAsDataURL(file);
  });

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings());
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState('');

  const updateSetting = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError('');
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }
      const logoDataUrl = await readFileAsDataUrl(file);
      updateSetting('businessLogoUrl', logoDataUrl);
    } catch (error) {
      setLogoError((error as Error).message);
    } finally {
      event.target.value = '';
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      saveBusinessSettings(settings);
      alert('Business settings saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Settings</h1>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Business Profile</h2>
              <p className="text-sm text-gray-600">Configure business type, contact details, and admin branding.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={settings.businessType}
                onChange={(event) =>
                  updateSetting('businessType', event.target.value as RestaurantBusinessType)
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                {(Object.keys(BUSINESS_TYPE_LABELS) as RestaurantBusinessType[]).map((type) => (
                  <option key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                value={settings.businessName}
                onChange={(event) => updateSetting('businessName', event.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SRS Admin Portal Demo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number (optional)</label>
              <input
                value={settings.unitNumber}
                onChange={(event) => updateSetting('unitNumber', event.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Suite 200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
              <input
                value={settings.businessPhone}
                onChange={(event) => updateSetting('businessPhone', event.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <input
              value={settings.businessAddress}
              onChange={(event) => updateSetting('businessAddress', event.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="123 Ocean Ave, Santa Monica, CA 90401"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Admin Portal Logo</h3>
            </div>

            {settings.businessLogoUrl ? (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 inline-flex items-center gap-3">
                <img src={settings.businessLogoUrl} alt="Business logo preview" className="h-10 w-auto" />
                <button
                  type="button"
                  onClick={() => updateSetting('businessLogoUrl', '')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove logo
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No logo uploaded yet. Default Spoonbill logo will be used.</div>
            )}

            <label className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50 cursor-pointer w-fit">
              <Upload className="h-4 w-4" />
              Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {logoError && <div className="text-sm text-red-600">{logoError}</div>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
