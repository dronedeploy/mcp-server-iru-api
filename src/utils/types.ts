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

// Licensing information
export interface KandjiLicensing {
  total_licenses?: number;
  used_licenses?: number;
  available_licenses?: number;
  license_type?: string;
  subscription_status?: string;
  expiration_date?: string;
  license_tier?: string;
  // Allow additional fields since exact structure is unknown
  [key: string]: any;
}

// User management types
export interface KandjiUser {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  integration_id?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UserListResponse {
  results: KandjiUser[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

// Tags types
export interface KandjiTag {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
  [key: string]: any;
}

// Vulnerability management types
export interface Vulnerability {
  cve_id: string;
  cve_description?: string;
  cvss_score?: number;
  cvss_severity?: string;
  severity?: string;
  software?: string;
  device_count?: number;
  age?: number;
  known_exploit?: boolean;
  status?: string;
  first_detection_date?: string;
  cve_published_at?: string;
  cve_modified_at?: string;
  cve_link?: string;
  [key: string]: any;
}

export interface VulnerabilityListResponse {
  results: Vulnerability[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

export interface AffectedDevice {
  device_id: string;
  device_name: string;
  device_serial_number?: string;
  device_model?: string;
  device_os_version?: string;
  blueprint_id?: string;
  blueprint_name?: string;
  software_name?: string;
  software_version?: string;
  detection_datetime?: string;
  [key: string]: any;
}

export interface AffectedSoftware {
  name: string;
  version?: string;
  path?: string;
  bundle_id?: string;
  device_count?: number;
  blueprint_id?: string;
  detection_datetime?: string;
  [key: string]: any;
}

export interface VulnerabilityDetection {
  device_id: string;
  device_name: string;
  device_serial_number?: string;
  device_model?: string;
  device_os_version?: string;
  blueprint_id?: string;
  blueprint_name?: string;
  name: string; // software name
  path?: string;
  version?: string;
  bundle_id?: string;
  cve_id: string;
  cve_description?: string;
  cve_link?: string;
  cvss_score?: number;
  cvss_severity?: string;
  detection_datetime?: string;
  cve_published_at?: string;
  cve_modified_at?: string;
  [key: string]: any;
}

export interface VulnerabilityDetectionListResponse {
  results: VulnerabilityDetection[];
  next?: string | null;
  count?: number;
}

// Threat/Detection types
export interface BehavioralDetection {
  id: string;
  threat_id: string;
  classification?: string;
  device_id?: string;
  device_name?: string;
  parent_process_name?: string;
  target_process_name?: string;
  malware_family?: string;
  detection_date?: string;
  status?: string;
  informational_tags?: string[];
  file_hash?: string;
  image_path?: string;
  [key: string]: any;
}

export interface ThreatDetail {
  id: string;
  threat_name: string;
  classification: string;
  device_id?: string;
  device_name?: string;
  process_name?: string;
  process_owner?: string;
  detection_date?: string;
  status?: string;
  file_hash?: string;
  file_path?: string;
  [key: string]: any;
}
