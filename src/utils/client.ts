/**
 * Kandji API Client
 * Handles all HTTP interactions with the Kandji API
 */

import {
  KandjiConfig,
  KandjiDevice,
  KandjiBlueprint,
  KandjiApp,
  KandjiActivity,
  DeviceActionResponse,
  KandjiLicensing,
  KandjiUser,
  UserListResponse,
  KandjiTag,
  Vulnerability,
  VulnerabilityListResponse,
  AffectedDevice,
  AffectedSoftware,
  VulnerabilityDetectionListResponse,
  BehavioralDetection,
  ThreatDetail,
} from './types.js';

export class KandjiClient {
  private apiToken: string;
  private baseUrl: string;
  private enablePIIRedaction: boolean;

  constructor(config: KandjiConfig) {
    this.apiToken = config.apiToken;
    this.enablePIIRedaction = config.enablePIIRedaction || false;

    // Construct base URL based on region
    // US: https://{subdomain}.api.kandji.io/api/v1
    // EU: https://{subdomain}.api.eu.kandji.io/api/v1
    const region = config.region || 'us';
    this.baseUrl = region === 'eu'
      ? `https://${config.subdomain}.api.eu.kandji.io/api/v1`
      : `https://${config.subdomain}.api.kandji.io/api/v1`;
  }

  /**
   * Make an authenticated request to the Kandji API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Handle API errors with proper categorization
   */
  private async handleError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `Kandji API error: ${response.statusText}`;

    try {
      const errorData = await response.json() as { error?: string };
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Unable to parse error response
    }

    if (status === 401) {
      throw new Error(`Authentication failed: ${errorMessage}`);
    } else if (status === 404) {
      throw new Error(`Resource not found: ${errorMessage}`);
    } else if (status === 429) {
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    } else if (status >= 500) {
      throw new Error(`Kandji server error: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }

  /**
   * Redact PII from data if enabled
   */
  private redactPII<T>(data: T): T {
    if (!this.enablePIIRedaction) {
      return data;
    }

    // Create a deep copy to avoid mutating original
    const redacted = JSON.parse(JSON.stringify(data));

    // Recursively redact PII fields
    const redactObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item));
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'user_email' || key === 'email') {
            result[key] = '[REDACTED]';
          } else if (key === 'user_name' || key === 'name') {
            result[key] = '[REDACTED]';
          } else {
            result[key] = redactObject(value);
          }
        }
        return result;
      }
      return obj;
    };

    return redactObject(redacted);
  }

  /**
   * List all devices
   */
  async listDevices(params?: {
    blueprint_id?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<KandjiDevice[]> {
    const queryParams = new URLSearchParams();
    if (params?.blueprint_id) queryParams.set('blueprint_id', params.blueprint_id);
    if (params?.platform) queryParams.set('platform', params.platform);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const endpoint = `/devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const devices = await this.request<KandjiDevice[]>(endpoint);
    return this.redactPII(devices);
  }

  /**
   * Get device details by ID
   */
  async getDevice(deviceId: string): Promise<KandjiDevice> {
    const device = await this.request<KandjiDevice>(`/devices/${deviceId}`);
    return this.redactPII(device);
  }

  /**
   * Get device apps
   */
  async getDeviceApps(deviceId: string): Promise<KandjiApp[]> {
    return this.request<KandjiApp[]>(`/devices/${deviceId}/apps`);
  }

  /**
   * Get device activity
   */
  async getDeviceActivity(deviceId: string): Promise<KandjiActivity[]> {
    return this.request<KandjiActivity[]>(`/devices/${deviceId}/activity`);
  }

  /**
   * List all blueprints
   */
  async listBlueprints(): Promise<KandjiBlueprint[]> {
    return this.request<KandjiBlueprint[]>('/blueprints');
  }

  /**
   * Get blueprint details by ID
   */
  async getBlueprint(blueprintId: string): Promise<KandjiBlueprint> {
    return this.request<KandjiBlueprint>(`/blueprints/${blueprintId}`);
  }

  /**
   * Get Prism device information (compliance data)
   */
  async getPrismDeviceInfo(params?: {
    blueprint_id?: string;
    platform?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.blueprint_id) queryParams.set('blueprint_id', params.blueprint_id);
    if (params?.platform) queryParams.set('platform', params.platform);

    const endpoint = `/prism/device_information${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await this.request<any[]>(endpoint);
    return this.redactPII(data);
  }

  /**
   * Lock a device
   */
  async lockDevice(deviceId: string, message?: string): Promise<DeviceActionResponse> {
    const body = message ? { message } : undefined;

    return this.request<DeviceActionResponse>(`/devices/${deviceId}/action/lock`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Restart a device
   */
  async restartDevice(deviceId: string): Promise<DeviceActionResponse> {
    return this.request<DeviceActionResponse>(`/devices/${deviceId}/action/restart`, {
      method: 'POST',
    });
  }

  /**
   * Shutdown a device
   */
  async shutdownDevice(deviceId: string): Promise<DeviceActionResponse> {
    return this.request<DeviceActionResponse>(`/devices/${deviceId}/action/shutdown`, {
      method: 'POST',
    });
  }

  /**
   * Erase a device
   */
  async eraseDevice(deviceId: string, options?: {
    pin?: string;
    preserve_data_plan?: boolean;
    disallow_proximity_setup?: boolean;
  }): Promise<DeviceActionResponse> {
    return this.request<DeviceActionResponse>(`/devices/${deviceId}/action/erase`, {
      method: 'POST',
      body: options ? JSON.stringify(options) : undefined,
    });
  }

  /**
   * Get FileVault recovery key for a device
   */
  async getFileVaultKey(deviceId: string): Promise<{ filevault_key: string }> {
    return this.request<{ filevault_key: string }>(`/devices/${deviceId}/secrets/filevaultkey`);
  }

  /**
   * Get Kandji tenant licensing and utilization information
   */
  async getLicensing(): Promise<KandjiLicensing> {
    return this.request<KandjiLicensing>('/settings/licensing');
  }

  /**
   * List users from user directory integrations
   */
  async listUsers(params?: {
    email?: string;
    id?: string;
    integration_id?: string;
    archived?: boolean;
    cursor?: string;
  }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.email) queryParams.set('email', params.email);
    if (params?.id) queryParams.set('id', params.id);
    if (params?.integration_id) queryParams.set('integration_id', params.integration_id);
    if (params?.archived !== undefined) queryParams.set('archived', params.archived.toString());
    if (params?.cursor) queryParams.set('cursor', params.cursor);

    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<UserListResponse>(endpoint);
    return this.redactPII(response);
  }

  /**
   * Get specific user by ID
   */
  async getUser(userId: string): Promise<KandjiUser> {
    const user = await this.request<KandjiUser>(`/users/${userId}`);
    return this.redactPII(user);
  }

  /**
   * Get configured tags
   */
  async getTags(params?: {
    search?: string;
  }): Promise<KandjiTag[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);

    const endpoint = `/tags${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<KandjiTag[]>(endpoint);
  }

  /**
   * List all vulnerabilities grouped by CVE
   */
  async listVulnerabilities(params?: {
    page?: number;
    size?: number;
    sort_by?: string;
    filter?: string;
  }): Promise<VulnerabilityListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.filter) queryParams.set('filter', params.filter);

    const endpoint = `/vulnerability-management/vulnerabilities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<VulnerabilityListResponse>(endpoint);
  }

  /**
   * Get vulnerability details by CVE ID
   */
  async getVulnerability(cveId: string): Promise<Vulnerability> {
    return this.request<Vulnerability>(`/vulnerability-management/vulnerabilities/${cveId}`);
  }

  /**
   * List devices affected by a specific CVE
   */
  async listAffectedDevices(cveId: string, params?: {
    page?: number;
    size?: number;
    sort_by?: string;
    filter?: string;
  }): Promise<{ results: AffectedDevice[]; next?: string | null; count?: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.filter) queryParams.set('filter', params.filter);

    const endpoint = `/vulnerability-management/vulnerabilities/${cveId}/devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ results: AffectedDevice[]; next?: string | null; count?: number }>(endpoint);
  }

  /**
   * List software affected by a specific CVE
   */
  async listAffectedSoftware(cveId: string, params?: {
    page?: number;
    size?: number;
    sort_by?: string;
    filter?: string;
  }): Promise<{ results: AffectedSoftware[]; next?: string | null; count?: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set('page', params.page.toString());
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.filter) queryParams.set('filter', params.filter);

    const endpoint = `/vulnerability-management/vulnerabilities/${cveId}/software${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ results: AffectedSoftware[]; next?: string | null; count?: number }>(endpoint);
  }

  /**
   * List all vulnerability detections across the fleet
   */
  async listVulnerabilityDetections(params?: {
    after?: string;
    size?: number;
    filter?: string;
  }): Promise<VulnerabilityDetectionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.after) queryParams.set('after', params.after);
    if (params?.size !== undefined) queryParams.set('size', params.size.toString());
    if (params?.filter) queryParams.set('filter', params.filter);

    const endpoint = `/vulnerability-management/detections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<VulnerabilityDetectionListResponse>(endpoint);
  }

  /**
   * Get behavioral detections
   */
  async listBehavioralDetections(params?: {
    threat_id?: string;
    classification?: string;
    status?: string;
    date_range?: number;
    detection_date_from?: string;
    detection_date_to?: string;
    device_id?: string;
    malware_family?: string;
    parent_process_name?: string;
    target_process_name?: string;
    informational_tags?: string;
    term?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<BehavioralDetection[]> {
    const queryParams = new URLSearchParams();
    if (params?.threat_id) queryParams.set('threat_id', params.threat_id);
    if (params?.classification) queryParams.set('classification', params.classification);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.date_range !== undefined) queryParams.set('date_range', params.date_range.toString());
    if (params?.detection_date_from) queryParams.set('detection_date_from', params.detection_date_from);
    if (params?.detection_date_to) queryParams.set('detection_date_to', params.detection_date_to);
    if (params?.device_id) queryParams.set('device_id', params.device_id);
    if (params?.malware_family) queryParams.set('malware_family', params.malware_family);
    if (params?.parent_process_name) queryParams.set('parent_process_name', params.parent_process_name);
    if (params?.target_process_name) queryParams.set('target_process_name', params.target_process_name);
    if (params?.informational_tags) queryParams.set('informational_tags', params.informational_tags);
    if (params?.term) queryParams.set('term', params.term);
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());

    const endpoint = `/behavioral-detections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<BehavioralDetection[]>(endpoint);
  }

  /**
   * Get threat details
   */
  async getThreatDetails(params?: {
    classification?: string;
    date_range?: number;
    device_id?: string;
    status?: string;
    sort_by?: string;
    term?: string;
    limit?: number;
    offset?: number;
  }): Promise<ThreatDetail[]> {
    const queryParams = new URLSearchParams();
    if (params?.classification) queryParams.set('classification', params.classification);
    if (params?.date_range !== undefined) queryParams.set('date_range', params.date_range.toString());
    if (params?.device_id) queryParams.set('device_id', params.device_id);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.term) queryParams.set('term', params.term);
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());

    const endpoint = `/threat-details${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<ThreatDetail[]>(endpoint);
  }
}
