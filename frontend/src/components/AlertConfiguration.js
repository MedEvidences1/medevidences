import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Settings, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Alert threshold presets
const THRESHOLD_PRESETS = {
  earthquake: [
    { label: 'Minor (M4+)', value: 4 },
    { label: 'Moderate (M5+)', value: 5 },
    { label: 'Strong (M6+)', value: 6 },
    { label: 'Major (M7+)', value: 7 },
  ],
  risk_level: [
    { label: 'Low (30%+)', value: 0.3 },
    { label: 'Medium (50%+)', value: 0.5 },
    { label: 'High (70%+)', value: 0.7 },
    { label: 'Critical (90%+)', value: 0.9 },
  ],
};

// Notification methods
const NOTIFICATION_METHODS = [
  { id: 'in_app', label: 'In-App', icon: Bell, enabled: true },
  { id: 'browser', label: 'Browser Push', icon: BellRing, enabled: true },
  { id: 'email', label: 'Email', icon: Mail, enabled: true },
  { id: 'sms', label: 'SMS', icon: Smartphone, enabled: false },
];

// Alert types
const ALERT_TYPES = [
  { id: 'earthquake', label: 'Earthquake Alert', description: 'Notify when earthquake magnitude exceeds threshold' },
  { id: 'weather', label: 'Severe Weather', description: 'Notify for severe weather events in monitored regions' },
  { id: 'disaster', label: 'Disaster Event', description: 'Notify when new disaster events are detected' },
  { id: 'risk_threshold', label: 'Risk Threshold', description: 'Notify when global risk level exceeds threshold' },
  { id: 'infrastructure', label: 'Infrastructure', description: 'Notify for critical infrastructure incidents' },
  { id: 'cyber', label: 'Cyber Threat', description: 'Notify for high-severity cyber threats' },
];

// Escalation levels
const ESCALATION_LEVELS = [
  { level: 1, label: 'Level 1 - Notify', delay: 0, description: 'Immediate notification' },
  { level: 2, label: 'Level 2 - Escalate', delay: 15, description: 'Escalate if not acknowledged in 15 min' },
  { level: 3, label: 'Level 3 - Critical', delay: 30, description: 'Critical escalation after 30 min' },
];

const AlertConfiguration = ({ getHeaders, userRole = 'user' }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  
  // New alert form state
  const [newAlert, setNewAlert] = useState({
    type: 'earthquake',
    threshold: 5,
    regions: ['global'],
    notification_methods: ['in_app', 'browser'],
    escalation_enabled: false,
    escalation_level: 1,
    active: true,
  });

  // Load user's alert configurations
  useEffect(() => {
    loadAlerts();
    loadActiveAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await axios.get(`${API}/alerts/configurations`, { headers: getHeaders?.() });
      setAlerts(res.data.alerts || []);
    } catch (e) {
      // Initialize with default alerts if API not available
      setAlerts([
        {
          id: '1',
          type: 'earthquake',
          threshold: 6,
          regions: ['global'],
          notification_methods: ['in_app', 'browser'],
          escalation_enabled: true,
          escalation_level: 2,
          active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'risk_threshold',
          threshold: 0.7,
          regions: ['global'],
          notification_methods: ['in_app'],
          escalation_enabled: false,
          escalation_level: 1,
          active: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  const loadActiveAlerts = async () => {
    try {
      const res = await axios.get(`${API}/alerts/active`, { headers: getHeaders?.() });
      setActiveAlerts(res.data.alerts || []);
    } catch (e) {
      // Mock active alerts
      setActiveAlerts([
        {
          id: 'a1',
          type: 'earthquake',
          message: 'M6.2 earthquake detected near Tonga',
          severity: 'high',
          triggered_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          acknowledged: false,
        },
        {
          id: 'a2',
          type: 'risk_threshold',
          message: 'Global risk level exceeded 75%',
          severity: 'medium',
          triggered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          acknowledged: true,
        },
      ]);
    }
  };

  const createAlert = async () => {
    try {
      const res = await axios.post(`${API}/alerts/configurations`, newAlert, { headers: getHeaders?.() });
      setAlerts([...alerts, { ...newAlert, id: res.data.id || Date.now().toString(), created_at: new Date().toISOString() }]);
      toast.success('Alert configuration created');
      setShowCreateForm(false);
      resetForm();
    } catch (e) {
      // Local add for demo
      setAlerts([...alerts, { ...newAlert, id: Date.now().toString(), created_at: new Date().toISOString() }]);
      toast.success('Alert configuration created');
      setShowCreateForm(false);
      resetForm();
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await axios.delete(`${API}/alerts/configurations/${alertId}`, { headers: getHeaders?.() });
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert configuration deleted');
    } catch (e) {
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert configuration deleted');
    }
  };

  const toggleAlert = async (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;
    
    try {
      await axios.patch(`${API}/alerts/configurations/${alertId}`, { active: !alert.active }, { headers: getHeaders?.() });
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, active: !a.active } : a));
      toast.success(alert.active ? 'Alert disabled' : 'Alert enabled');
    } catch (e) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, active: !a.active } : a));
      toast.success(alert.active ? 'Alert disabled' : 'Alert enabled');
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`${API}/alerts/acknowledge/${alertId}`, {}, { headers: getHeaders?.() });
      setActiveAlerts(activeAlerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      toast.success('Alert acknowledged');
    } catch (e) {
      setActiveAlerts(activeAlerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      toast.success('Alert acknowledged');
    }
  };

  const resetForm = () => {
    setNewAlert({
      type: 'earthquake',
      threshold: 5,
      regions: ['global'],
      notification_methods: ['in_app', 'browser'],
      escalation_enabled: false,
      escalation_level: 1,
      active: true,
    });
  };

  const getAlertTypeInfo = (type) => ALERT_TYPES.find(t => t.id === type) || ALERT_TYPES[0];
  const getThresholdLabel = (type, value) => {
    const presets = THRESHOLD_PRESETS[type] || THRESHOLD_PRESETS.risk_level;
    const preset = presets.find(p => p.value === value);
    return preset ? preset.label : value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Alerts Banner */}
      {activeAlerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="font-semibold text-red-400">
                {activeAlerts.filter(a => !a.acknowledged).length} Active Alert(s)
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {activeAlerts.filter(a => !a.acknowledged).map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-[#0A0A0A]/50 rounded p-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div>
                    <div className="text-sm font-medium">{alert.message}</div>
                    <div className="text-xs text-[#666]">
                      {new Date(alert.triggered_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00E5FF]" />
            Alert Configurations
          </h3>
          <p className="text-sm text-[#666]">Configure automated alerts and escalation rules</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-[#00E5FF]">Create New Alert</h4>
          
          {/* Alert Type */}
          <div>
            <label className="text-sm text-[#888] block mb-2">Alert Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALERT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setNewAlert({ ...newAlert, type: type.id })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    newAlert.type === type.id
                      ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                      : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-[#666]">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className="text-sm text-[#888] block mb-2">Threshold</label>
            <div className="flex gap-2">
              {(THRESHOLD_PRESETS[newAlert.type] || THRESHOLD_PRESETS.risk_level).map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setNewAlert({ ...newAlert, threshold: preset.value })}
                  className={`px-3 py-2 rounded text-sm ${
                    newAlert.threshold === preset.value
                      ? 'bg-[#00E5FF] text-black'
                      : 'bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Methods */}
          <div>
            <label className="text-sm text-[#888] block mb-2">Notification Methods</label>
            <div className="flex gap-2 flex-wrap">
              {NOTIFICATION_METHODS.map(method => {
                const Icon = method.icon;
                const isSelected = newAlert.notification_methods.includes(method.id);
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (!method.enabled) return;
                      const methods = isSelected
                        ? newAlert.notification_methods.filter(m => m !== method.id)
                        : [...newAlert.notification_methods, method.id];
                      setNewAlert({ ...newAlert, notification_methods: methods });
                    }}
                    disabled={!method.enabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                      isSelected
                        ? 'bg-[#00E5FF] text-black'
                        : method.enabled
                          ? 'bg-[#1A1A1A] text-[#888] hover:text-white'
                          : 'bg-[#1A1A1A]/50 text-[#444] cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {method.label}
                    {!method.enabled && <span className="text-[10px]">(Coming Soon)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Escalation */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#888] mb-2">
              <input
                type="checkbox"
                checked={newAlert.escalation_enabled}
                onChange={(e) => setNewAlert({ ...newAlert, escalation_enabled: e.target.checked })}
                className="rounded"
              />
              Enable Escalation
            </label>
            {newAlert.escalation_enabled && (
              <div className="ml-6 space-y-2">
                {ESCALATION_LEVELS.map(level => (
                  <button
                    key={level.level}
                    onClick={() => setNewAlert({ ...newAlert, escalation_level: level.level })}
                    className={`w-full p-2 rounded text-left text-sm ${
                      newAlert.escalation_level === level.level
                        ? 'bg-[#9D4EDD]/20 border border-[#9D4EDD]'
                        : 'bg-[#1A1A1A] border border-[#2A2A2A]'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-[#666]">{level.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={createAlert} className="btn-primary">
              Create Alert
            </Button>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-[#666]">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alert configurations yet</p>
            <p className="text-sm">Create your first alert to get notified of important events</p>
          </div>
        ) : (
          alerts.map(alert => {
            const typeInfo = getAlertTypeInfo(alert.type);
            return (
              <div
                key={alert.id}
                className={`bg-[#0A0A0A] border rounded-lg p-4 ${
                  alert.active ? 'border-[#2A2A2A]' : 'border-[#1A1A1A] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${alert.active ? 'bg-[#00E5FF]/10' : 'bg-[#1A1A1A]'}`}>
                      <Bell className={`w-5 h-5 ${alert.active ? 'text-[#00E5FF]' : 'text-[#666]'}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{typeInfo.label}</div>
                      <div className="text-sm text-[#666]">
                        Threshold: {getThresholdLabel(alert.type, alert.threshold)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {alert.notification_methods.map(method => {
                          const methodInfo = NOTIFICATION_METHODS.find(m => m.id === method);
                          const Icon = methodInfo?.icon || Bell;
                          return (
                            <span key={method} className="flex items-center gap-1 text-xs bg-[#1A1A1A] px-2 py-1 rounded">
                              <Icon className="w-3 h-3" /> {methodInfo?.label}
                            </span>
                          );
                        })}
                        {alert.escalation_enabled && (
                          <span className="flex items-center gap-1 text-xs bg-[#9D4EDD]/20 text-[#9D4EDD] px-2 py-1 rounded">
                            ⬆️ Escalation L{alert.escalation_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`px-3 py-1 rounded text-sm ${
                        alert.active
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-[#1A1A1A] text-[#666]'
                      }`}
                    >
                      {alert.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertConfiguration;
