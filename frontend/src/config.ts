// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ol5nqp7rw7.execute-api.us-east-1.amazonaws.com/prod';

// API Endpoints
export const API_ENDPOINTS = {
  getKycRecords: (status?: string) => 
    status ? `${API_BASE_URL}/kyc?status=${status}` : `${API_BASE_URL}/kyc`,
  getKycById: (customerId: string) => `${API_BASE_URL}/kyc/${customerId}`,
  getUploadUrl: () => `${API_BASE_URL}/upload`,
};

// KYC Status Types
export type KYCStatus = 'PENDING' | 'VALIDATED' | 'VERIFIED' | 'COMPLETED' | 'FAILED' | 'FRAUD_DETECTED';

// KYC Event Interface
export interface KYCEvent {
  customerId: string;
  eventType: string;
  kycStatus: KYCStatus;
  documentUrl?: string;
  verificationScore?: number;
  fraudScore?: number;
  lastUpdated: string;
  metadata?: string;
}

// Upload Request Interface
export interface UploadRequest {
  customerId: string;
  documentType: string;
}

// Upload Response Interface
export interface UploadResponse {
  uploadUrl: string;
  key: string;
}
