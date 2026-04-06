'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Mail, MessageSquare, Webhook, Loader2, Save,
  ShoppingBag, CheckCircle2, XCircle, Zap,
  Table2, Users, Database,
} from 'lucide-react';

interface Integration {
  id?: string;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

const INTEGRATION_TYPES = [
  { id: 'mailchimp',     name: 'Mailchimp',      icon: Mail,         description: 'Sync leads directly to Mailchimp',        fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'list_id', label: 'Audience ID', type: 'text' }] },
  { id: 'klaviyo',       name: 'Klaviyo',         icon: MessageSquare,description: 'Sync leads directly to Klaviyo',           fields: [{ key: 'api_key', label: 'Private API Key', type: 'password' }, { key: 'list_id', label: 'List ID', type: 'text' }] },
  { id: 'webhook',       name: 'Webhooks',        icon: Webhook,      description: 'Send real-time alerts to any server',      fields: [{ key: 'url', label: 'Webhook URL', type: 'url' }, { key: 'secret', label: 'Secret (optional)', type: 'password' }] },
  { id: 'hubspot',       name: 'HubSpot',         icon: Users,        description: 'Create contacts in your HubSpot CRM',      fields: [{ key: 'access_token', label: 'Private App Token', type: 'password' }, { key: 'list_id', label: 'List ID (optional)', type: 'text' }] },
  { id: 'salesforce',    name: 'Salesforce',      icon: Database,     description: 'Create leads in Salesforce CRM',           fields: [{ key: 'instance_url', label: 'Instance URL', type: 'url' }, { key: 'client_id', label: 'Consumer Key', type: 'text' }, { key: 'client_secret', label: 'Consumer Secret', type: 'password' }, { key: 'username', label: 'Username', type: 'text' }, { key: 'password', label: 'Password', type: 'password' }, { key: 'security_token', label: 'Security Token', type: 'password' }] },
  { id: 'google_sheets', name: 'Google Sheets',   icon: Table2,       description: 'Append spin wins as rows in a Sheet',      fields: [{ key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text' }, { key: 'sheet_name', label: 'Sheet Name', type: 'text' }, { key: 'service_account_email', label: 'Service Account Email', type: 'text' }, { key: 'private_key', label: 'Private Key (PEM)', type: 'password' }] },
  { id: 'zapier',        name: 'Zapier',          icon: Zap,          description: 'Trigger Zapier workflows on spin wins',    fields: [{ key: 'webhook_url', label: 'Zapier Webhook URL', type: 'url' }] },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [shopify, setShopify] = useState<{ connected: boolean; integration?: Record<string, unknown>; price_rules?: unknown[] } | null>(null);
  const [shopifyForm, setShopifyForm] = useState({ shop_domain: '', access_token: '', price_rule_id: '', prefix: 'WHEEL', usage_limit: 1, expiry_days: 30 });
  const [shopifySaving, setShopifySaving] = useState(false);

  async function load() {
    try {
      const res = await api.get('/api/integrations');
      const data = await res.json();
      if (res.ok) {
        const mapped = data.integrations.reduce((acc: Record<string, Integration>, curr: Integration) => {
          acc[curr.type] = curr;
          return acc;
        }, {});
        setIntegrations(mapped);
      }
    } finally { setLoading(false); }
  }

  async function loadShopify() {
    try {
      const res = await api.get('/api/integrations/shopify');
      const data = await res.json();
      setShopify(data);
      if (data.connected && data.integration?.config) {
        const c = data.integration.config as Record<string, unknown>;
        setShopifyForm(f => ({ ...f, shop_domain: String(c.shop_domain || ''), prefix: String(c.prefix || 'WHEEL'), usage_limit: Number(c.usage_limit || 1), expiry_days: Number(c.expiry_days || 30), price_rule_id: String(c.price_rule_id || '') }));
      }
    } catch { /* non-fatal */ }
  }

  useEffect(() => { load(); loadShopify(); }, []);

  async function handleSave(type: string) {
    const integration = integrations[type];
    if (!integration) return;
    setSaving(type);
    try {
      const res = await api.post('/api/integrations', { type, config: integration.config, is_active: integration.is_active });
      if (res.ok) { toast.success(`${type} integration updated`); load(); }
      else toast.error('Failed to save integration');
    } finally { setSaving(null); }
  }

  function updateConfig(type: string, key: string, value: unknown) {
    setIntegrations(prev => ({
      ...prev,
      [type]: { ...prev[type] || { type, config: {}, is_active: false }, config: { ...prev[type]?.config, [key]: value } },
    }));
  }

  function toggleActive(type: string, active: boolean) {
    setIntegrations(prev => ({
      ...prev,
      [type]: { ...prev[type] || { type, config: {}, is_active: false }, is_active: active },
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to connect Shopify');
    } finally { setShopifySaving(false); }
  }

  async function disconnectShopify() {
    if (!confirm('Disconnect Shopify? Existing discount codes will still work.')) return;
    try {
      await api.del('/api/integrations/shopify');
      toast.success('Shopify disconnected');
      setShopify({ connected: false });
    } catch { toast.error('Failed to disconnect'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-violet-600 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Push leads and spin data to your marketing tools</p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATION_TYPES.map((type) => {
            const Icon = type.icon;
            const current = integrations[type.id] || { type: type.id, config: {}, is_active: false };
            const isSaving = saving === type.id;
            const isConnected = !!current.id && current.is_active;

            return (
              <Card key={type.id} className="relative overflow-hidden flex flex-col">
                {isConnected && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-600 to-emerald-400" />
                )}
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[10px] py-0.5">
                          Active
                        </Badge>
                      )}
                      <Switch
                        checked={current.is_active}
                        onCheckedChange={(val) => toggleActive(type.id, val)}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold">{type.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    {type.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-medium">{field.label}</Label>
                        <Input
                          type={field.type}
                          placeholder={`${field.label}…`}
                          value={String(current.config[field.key] || '')}
                          onChange={(e) => updateConfig(type.id, field.key, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs gap-1.5"
                    disabled={isSaving}
                    onClick={() => handleSave(type.id)}
                  >
                    {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {current.id ? 'Save Changes' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Shopify */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-600" /> Shopify
          </h2>
          <Card className={shopify?.connected ? 'border-emerald-500/30' : ''}>
            {shopify?.connected && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-t-xl" />
            )}
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Shopify Discount Codes</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Auto-generate single-use discount codes when a customer wins a prize.
                  </CardDescription>
                </div>
                {shopify?.connected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                    <XCircle className="h-3 w-3" /> Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {shopify?.connected ? (
                <>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                    {[
                      ['Store', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.shop_name ?? '')],
                      ['Domain', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.shop_domain ?? '')],
                      ['Code Prefix', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.prefix ?? 'WHEEL')],
                      ['Usage Limit', `${(shopify.integration as Record<string, Record<string, unknown>>)?.config?.usage_limit ?? 1} per code`],
                      ['Expiry', `${(shopify.integration as Record<string, Record<string, unknown>>)?.config?.expiry_days ?? 30} days`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="text-rose-500 border-rose-200 hover:bg-rose-500/10 hover:border-rose-500/30 text-xs h-8" onClick={disconnectShopify}>
                    Disconnect Shopify
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Shop Domain *', key: 'shop_domain', type: 'text', placeholder: 'my-store.myshopify.com' },
                    { label: 'Admin API Access Token *', key: 'access_token', type: 'password', placeholder: 'shpat_…' },
                    { label: 'Price Rule ID *', key: 'price_rule_id', type: 'text', placeholder: 'e.g. 12345678' },
                    { label: 'Code Prefix', key: 'prefix', type: 'text', placeholder: 'WHEEL' },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Input
                        type={f.type}
                        placeholder={f.placeholder}
                        className="h-8 text-xs"
                        value={shopifyForm[f.key as keyof typeof shopifyForm] as string}
                        onChange={e => setShopifyForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Expiry (days)</Label>
                    <Input type="number" min={1} max={365} className="h-8 text-xs" value={shopifyForm.expiry_days}
                      onChange={e => setShopifyForm(f => ({ ...f, expiry_days: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5" onClick={connectShopify} disabled={shopifySaving}>
                      {shopifySaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                      {shopifySaving ? 'Connecting…' : 'Connect Shopify'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
