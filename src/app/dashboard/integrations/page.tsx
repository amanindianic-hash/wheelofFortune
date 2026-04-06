'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Webhook, Loader2, Save, ShoppingBag, CheckCircle2, XCircle, Zap, Table2, Users, Database } from 'lucide-react';

interface Integration {
  id?: string;
  type: string;
  config: Record<string, any>;
  is_active: boolean;
}

const INTEGRATION_TYPES = [
  { id: 'mailchimp', name: 'Mailchimp', icon: Mail, description: 'Sync leads directly to Mailchimp', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'list_id', label: 'Audience ID', type: 'text' }] },
  { id: 'klaviyo', name: 'Klaviyo', icon: MessageSquare, description: 'Sync leads directly to Klaviyo', fields: [{ key: 'api_key', label: 'Private API Key', type: 'password' }, { key: 'list_id', label: 'List ID', type: 'text' }] },
  { id: 'webhook', name: 'Webhooks', icon: Webhook, description: 'Send real-time alerts to any server', fields: [{ key: 'url', label: 'Webhook URL', type: 'url' }, { key: 'secret', label: 'Secret (optional)', type: 'password' }] },
  { id: 'hubspot', name: 'HubSpot', icon: Users, description: 'Create contacts in your HubSpot CRM', fields: [{ key: 'access_token', label: 'Private App Token', type: 'password' }, { key: 'list_id', label: 'List ID (optional)', type: 'text' }] },
  { id: 'salesforce', name: 'Salesforce', icon: Database, description: 'Create leads in Salesforce CRM', fields: [{ key: 'instance_url', label: 'Instance URL', type: 'url' }, { key: 'client_id', label: 'Consumer Key', type: 'text' }, { key: 'client_secret', label: 'Consumer Secret', type: 'password' }, { key: 'username', label: 'Username', type: 'text' }, { key: 'password', label: 'Password', type: 'password' }, { key: 'security_token', label: 'Security Token', type: 'password' }] },
  { id: 'google_sheets', name: 'Google Sheets', icon: Table2, description: 'Append spin wins as rows in a Sheet', fields: [{ key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text' }, { key: 'sheet_name', label: 'Sheet Name (tab)', type: 'text' }, { key: 'service_account_email', label: 'Service Account Email', type: 'text' }, { key: 'private_key', label: 'Private Key (PEM)', type: 'password' }] },
  { id: 'zapier', name: 'Zapier', icon: Zap, description: 'Trigger Zapier workflows on spin wins', fields: [{ key: 'webhook_url', label: 'Zapier Webhook URL', type: 'url' }] },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Shopify state
  const [shopify, setShopify] = useState<{ connected: boolean; integration?: any; price_rules?: any[] } | null>(null);
  const [shopifyForm, setShopifyForm] = useState({ shop_domain: '', access_token: '', price_rule_id: '', prefix: 'WHEEL', usage_limit: 1, expiry_days: 30 });
  const [shopifySaving, setShopifySaving] = useState(false);

  async function load() {
    try {
      const res = await api.get('/api/integrations');
      const data = await res.json();
      if (res.ok) {
        const mapped = data.integrations.reduce((acc: any, curr: Integration) => {
          acc[curr.type] = curr;
          return acc;
        }, {});
        setIntegrations(mapped);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadShopify() {
    try {
      const res = await api.get('/api/integrations/shopify');
      const data = await res.json();
      setShopify(data);
      if (data.connected && data.integration?.config) {
        const c = data.integration.config;
        setShopifyForm(f => ({ ...f, shop_domain: c.shop_domain || '', prefix: c.prefix || 'WHEEL', usage_limit: c.usage_limit || 1, expiry_days: c.expiry_days || 30, price_rule_id: c.price_rule_id || '' }));
      }
    } catch { /* non-fatal */ }
  }

  useEffect(() => { load(); loadShopify(); }, []);

  async function handleSave(type: string) {
    const integration = integrations[type];
    if (!integration) return;

    setSaving(type);
    try {
      const res = await api.post('/api/integrations', {
        type,
        config: integration.config,
        is_active: integration.is_active,
      });
      if (res.ok) {
        toast.success(`${type} integration updated`);
        load();
      } else {
        toast.error('Failed to save integration');
      }
    } finally {
      setSaving(null);
    }
  }

  function updateConfig(type: string, key: string, value: any) {
    setIntegrations(prev => ({
      ...prev,
      [type]: {
        ...prev[type] || { type, config: {}, is_active: false },
        config: { ...prev[type]?.config, [key]: value }
      }
    }));
  }

  function toggleActive(type: string, active: boolean) {
    setIntegrations(prev => ({
      ...prev,
      [type]: {
        ...prev[type] || { type, config: {}, is_active: false },
        is_active: active
      }
    }));
  }

  async function connectShopify() {
    if (!shopifyForm.shop_domain || !shopifyForm.access_token || !shopifyForm.price_rule_id) {
      toast.error('Please fill in Shop Domain, Access Token and Price Rule');
      return;
    }
    setShopifySaving(true);
    try {
      await api.post('/api/integrations/shopify', shopifyForm);
      toast.success('Shopify connected successfully!');
      await loadShopify();
    } catch (e: any) {
      toast.error(e.message || 'Failed to connect Shopify');
    } finally {
      setShopifySaving(false);
    }
  }

  async function disconnectShopify() {
    if (!confirm('Disconnect Shopify? Existing discount codes will still work.')) return;
    try {
      await api.del('/api/integrations/shopify');
      toast.success('Shopify disconnected');
      setShopify({ connected: false });
    } catch {
      toast.error('Failed to disconnect');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Push leads and spin data to your favorite marketing tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATION_TYPES.map((type) => {
          const Icon = type.icon;
          const current = integrations[type.id] || { type: type.id, config: {}, is_active: false };
          const isSaving = saving === type.id;

          return (
            <Card key={type.id} className="relative overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="bg-violet-50 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                  <Icon className="text-violet-600 w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <Switch 
                    checked={current.is_active} 
                    onCheckedChange={(val) => toggleActive(type.id, val)}
                  />
                </div>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {type.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {field.label}
                      </Label>
                      <Input
                        type={field.type}
                        placeholder={`Enter ${field.label.toLowerCase()}…`}
                        value={current.config[field.key] || ''}
                        onChange={(e) => updateConfig(type.id, field.key, e.target.value)}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-violet-600 hover:bg-violet-700 h-9 mt-2" 
                  disabled={isSaving}
                  onClick={() => handleSave(type.id)}
                >
                  {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {current.id ? 'Save Changes' : 'Connect Integration'}
                </Button>
              </CardContent>
              {current.id && current.is_active && (
                <div className="absolute top-0 right-0 p-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Shopify Integration — dedicated card */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-green-600" /> Shopify
        </h2>
        <Card className={`border-2 ${shopify?.connected ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Shopify Discount Codes</CardTitle>
                <CardDescription className="mt-0.5">
                  Auto-generate single-use discount codes when a customer wins a prize.
                </CardDescription>
              </div>
              {shopify?.connected ? (
                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {shopify?.connected ? (
              <>
                <div className="text-sm space-y-1 bg-white border rounded-lg p-3">
                  <p><span className="font-medium">Store:</span> {shopify.integration?.config?.shop_name}</p>
                  <p><span className="font-medium">Domain:</span> {shopify.integration?.config?.shop_domain}</p>
                  <p><span className="font-medium">Code Prefix:</span> {shopify.integration?.config?.prefix || 'WHEEL'}</p>
                  <p><span className="font-medium">Usage Limit:</span> {shopify.integration?.config?.usage_limit || 1} per code</p>
                  <p><span className="font-medium">Expiry:</span> {shopify.integration?.config?.expiry_days || 30} days</p>
                </div>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={disconnectShopify}>
                  Disconnect Shopify
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Shop Domain *</Label>
                  <Input placeholder="my-store.myshopify.com" value={shopifyForm.shop_domain} onChange={e => setShopifyForm(f => ({ ...f, shop_domain: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin API Access Token *</Label>
                  <Input type="password" placeholder="shpat_…" value={shopifyForm.access_token} onChange={e => setShopifyForm(f => ({ ...f, access_token: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Price Rule ID * <span className="normal-case font-normal">(from Shopify Discounts)</span></Label>
                  <Input placeholder="e.g. 12345678" value={shopifyForm.price_rule_id} onChange={e => setShopifyForm(f => ({ ...f, price_rule_id: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Code Prefix</Label>
                  <Input placeholder="WHEEL" value={shopifyForm.prefix} onChange={e => setShopifyForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Expiry (days)</Label>
                  <Input type="number" min={1} max={365} value={shopifyForm.expiry_days} onChange={e => setShopifyForm(f => ({ ...f, expiry_days: parseInt(e.target.value) || 30 }))} />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-green-600 hover:bg-green-700 h-10" onClick={connectShopify} disabled={shopifySaving}>
                    {shopifySaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                    {shopifySaving ? 'Connecting…' : 'Connect Shopify'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
