/**
 * Kandji API Client
 * Handles all HTTP interactions with the Kandji API
 */

import { KandjiConfig, KandjiDevice, KandjiBlueprint, KandjiApp, KandjiActivity, DeviceActionResponse } from './types.js';

export class KandjiClient {
  private apiToken: string;
  private baseUrl: string;
  private enablePIIRedaction: boolean;

  constructor(config: KandjiConfig) {
    this.apiToken = config.apiToken;
    this.enablePIIRedaction = config.enablePIIRedaction || false;

    // Construct base URL based on region
    const region = config.region === 'eu' ? 'eu' : 'us-1';
    this.baseUrl = `https://${config.subdomain}.api.${region === 'eu' ? 'eu' : ''}.kandji.io/api/v1`.replace('.kandji', region === 'eu' ? '.kandji' : '.clients.us-1.kandji');
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
}
