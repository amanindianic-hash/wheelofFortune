'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
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
  { id: 'mailchimp',     name: 'Mailchimp',     icon: Mail,          description: 'Sync leads directly to Mailchimp',      fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'list_id', label: 'Audience ID', type: 'text' }] },
  { id: 'klaviyo',       name: 'Klaviyo',        icon: MessageSquare, description: 'Sync leads directly to Klaviyo',         fields: [{ key: 'api_key', label: 'Private API Key', type: 'password' }, { key: 'list_id', label: 'List ID', type: 'text' }] },
  { id: 'webhook',       name: 'Webhooks',       icon: Webhook,       description: 'Send real-time alerts to any server',    fields: [{ key: 'url', label: 'Webhook URL', type: 'url' }, { key: 'secret', label: 'Secret (optional)', type: 'password' }] },
  { id: 'hubspot',       name: 'HubSpot',        icon: Users,         description: 'Create contacts in your HubSpot CRM',    fields: [{ key: 'access_token', label: 'Private App Token', type: 'password' }, { key: 'list_id', label: 'List ID (optional)', type: 'text' }] },
  { id: 'salesforce',    name: 'Salesforce',     icon: Database,      description: 'Create leads in Salesforce CRM',         fields: [{ key: 'instance_url', label: 'Instance URL', type: 'url' }, { key: 'client_id', label: 'Consumer Key', type: 'text' }, { key: 'client_secret', label: 'Consumer Secret', type: 'password' }, { key: 'username', label: 'Username', type: 'text' }, { key: 'password', label: 'Password', type: 'password' }, { key: 'security_token', label: 'Security Token', type: 'password' }] },
  { id: 'google_sheets', name: 'Google Sheets',  icon: Table2,        description: 'Append spin wins as rows in a Sheet',    fields: [{ key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text' }, { key: 'sheet_name', label: 'Sheet Name', type: 'text' }, { key: 'service_account_email', label: 'Service Account Email', type: 'text' }, { key: 'private_key', label: 'Private Key (PEM)', type: 'password' }] },
  { id: 'zapier',        name: 'Zapier',         icon: Zap,           description: 'Trigger Zapier workflows on spin wins',   fields: [{ key: 'webhook_url', label: 'Zapier Webhook URL', type: 'url' }] },
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
        <Loader2 className="animate-spin text-violet-500 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#13131b]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-400 mb-1">Connections</p>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-white">Integrations</h1>
          <p className="text-sm text-white/50 mt-0.5">Push leads and spin data to your marketing tools</p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATION_TYPES.map((type) => {
            const Icon = type.icon;
            const current = integrations[type.id] || { type: type.id, config: {}, is_active: false };
            const isSaving = saving === type.id;
            const isConnected = !!current.id && current.is_active;

            return (
              <div key={type.id} className="relative overflow-hidden rounded-2xl border border-white/5 bg-[rgba(31,31,40,0.7)] backdrop-blur-xl flex flex-col">
                {isConnected && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-600 to-emerald-400" />
                )}
                <div className="px-5 pt-5 pb-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <Icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isConnected && (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-2 py-0.5 text-[10px] font-medium">
                          Active
                        </span>
                      )}
                      <Switch
                        checked={current.is_active}
                        onCheckedChange={(val) => toggleActive(type.id, val)}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">{type.name}</p>
                  <p className="text-xs text-white/40 mt-0.5 mb-4">{type.description}</p>
                  <div className="space-y-3 flex-1">
                    {type.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[11px] font-medium text-white/50">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={`${field.label}…`}
                          value={String(current.config[field.key] || '')}
                          onChange={(e) => updateConfig(type.id, field.key, e.target.value)}
                          className="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    className="w-full h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_0_1px_rgba(124,58,237,0.4)] transition-all disabled:opacity-50"
                    disabled={isSaving}
                    onClick={() => handleSave(type.id)}
                  >
                    {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {current.id ? 'Save Changes' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shopify */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-400" /> Shopify
          </h2>
          <div className={`relative rounded-2xl border bg-[rgba(31,31,40,0.7)] backdrop-blur-xl overflow-hidden ${shopify?.connected ? 'border-emerald-500/30' : 'border-white/5'}`}>
            {shopify?.connected && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-600 to-emerald-400" />
            )}
            <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Shopify Discount Codes</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Auto-generate single-use discount codes when a customer wins a prize.
                </p>
              </div>
              {shopify?.connected ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-2 py-0.5 text-[11px] font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 text-[11px] font-medium">
                  <XCircle className="h-3 w-3" /> Not Connected
                </span>
              )}
            </div>
            <div className="p-5">
              {shopify?.connected ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1.5 text-xs">
                    {[
                      ['Store', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.shop_name ?? '')],
                      ['Domain', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.shop_domain ?? '')],
                      ['Code Prefix', String((shopify.integration as Record<string, Record<string, unknown>>)?.config?.prefix ?? 'WHEEL')],
                      ['Usage Limit', `${(shopify.integration as Record<string, Record<string, unknown>>)?.config?.usage_limit ?? 1} per code`],
                      ['Expiry', `${(shopify.integration as Record<string, Record<string, unknown>>)?.config?.expiry_days ?? 30} days`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-white/40">{k}</span>
                        <span className="font-medium text-white/80">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={disconnectShopify}
                    className="h-8 px-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                  >
                    Disconnect Shopify
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Shop Domain *', key: 'shop_domain', type: 'text', placeholder: 'my-store.myshopify.com' },
                    { label: 'Admin API Access Token *', key: 'access_token', type: 'password', placeholder: 'shpat_…' },
                    { label: 'Price Rule ID *', key: 'price_rule_id', type: 'text', placeholder: 'e.g. 12345678' },
                    { label: 'Code Prefix', key: 'prefix', type: 'text', placeholder: 'WHEEL' },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-xs font-medium text-white/50">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        className="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                        value={shopifyForm[f.key as keyof typeof shopifyForm] as string}
                        onChange={e => setShopifyForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50">Expiry (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="h-8 w-full rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors"
                      value={shopifyForm.expiry_days}
                      onChange={e => setShopifyForm(f => ({ ...f, expiry_days: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      className="w-full h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_0_1px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
                      onClick={connectShopify}
                      disabled={shopifySaving}
                    >
                      {shopifySaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                      {shopifySaving ? 'Connecting…' : 'Connect Shopify'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
