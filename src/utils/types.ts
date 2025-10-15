/**
 * TypeScript types and interfaces for Kandji API
 */

// MCP Response Envelope
export interface MCPResponse<T = unknown> {
  success: boolean;
  summary?: string;
  table?: {
    columns: string[];
    rows: Record<string, string | number | boolean>[];
  };
  data?: T;
  metadata?: {
    totalCount?: number;
    limit?: number;
    offset?: number;
    elapsedMs?: number;
    cached?: boolean;
    source?: string;
  };
  suggestions?: string[];
  errors?: ErrorDetail[];
}

// Error handling
export type ErrorCategory = 'validation' | 'auth' | 'rate_limit' | 'network' | 'server';

export interface ErrorDetail {
  category: ErrorCategory;
  message: string;
  recovery: string[];
}

// Kandji Device types
export interface KandjiDevice {
  device_id: string;
  device_name: string;
  serial_number: string;
  platform: 'Mac' | 'iPhone' | 'iPad' | 'AppleTV';
  os_version: string;
  model: string;
  user_name?: string;
  user_email?: string;
  asset_tag?: string;
  blueprint_id?: string;
  blueprint_name?: string;
  last_check_in?: string;
  is_supervised?: boolean;
  is_dep_enrolled?: boolean;
  mdm_enabled?: boolean;
  agent_installed?: boolean;
}

// Kandji Blueprint types
export interface KandjiBlueprint {
  id: string;
  name: string;
  description?: string;
  enrollment_code_is_active?: boolean;
  enrollment_code?: string;
  library_items?: LibraryItem[];
}

export interface LibraryItem {
  id: string;
  name: string;
  type: 'profile' | 'script' | 'app';
}

// Kandji App types
export interface KandjiApp {
  name: string;
  version: string;
  bundle_id?: string;
  install_date?: string;
}

// Kandji Activity types
export interface KandjiActivity {
  timestamp: string;
  event_type: string;
  description: string;
  user?: string;
}

// Device action types
export type DeviceAction = 'lock' | 'restart' | 'shutdown' | 'erase';

export interface DeviceActionRequest {
  action: DeviceAction;
  confirm: boolean;
  message?: string; // For lock action
  pin?: string; // For erase action on macOS
}

export interface DeviceActionResponse {
  success: boolean;
  unlock_pin?: string; // Returned for macOS lock action
  message: string;
}

// API Client configuration
export interface KandjiConfig {
  apiToken: string;
  subdomain: string;
  region: 'us' | 'eu';
  enablePIIRedaction?: boolean;
}

// Cache entry
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Search criteria
export interface DeviceSearchCriteria {
  name?: string;
  platform?: 'Mac' | 'iPhone' | 'iPad' | 'AppleTV';
  blueprint_id?: string;
  compliance_status?: 'compliant' | 'non_compliant';
}

// Compliance summary
export interface ComplianceSummary {
  total_devices: number;
  compliant_devices: number;
  non_compliant_devices: number;
  compliance_percentage: number;
  by_platform: Record<string, { compliant: number; non_compliant: number }>;
}
