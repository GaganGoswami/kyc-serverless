import axios from 'axios';
import { API_ENDPOINTS, KYCEvent, UploadRequest, UploadResponse } from './config';

const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const kycApi = {
  // Get all KYC records with optional status filter
  getKycRecords: async (status?: string): Promise<KYCEvent[]> => {
    const response = await api.get(API_ENDPOINTS.getKycRecords(status));
    return response.data;
  },

  // Get KYC records for specific customer
  getKycById: async (customerId: string): Promise<KYCEvent[]> => {
    const response = await api.get(API_ENDPOINTS.getKycById(customerId));
    return response.data;
  },

  // Get presigned upload URL
  getUploadUrl: async (request: UploadRequest): Promise<UploadResponse> => {
    const response = await api.post(API_ENDPOINTS.getUploadUrl(), request);
    return response.data;
  },

  // Upload file to S3 using presigned URL
  uploadFile: async (presignedUrl: string, file: File): Promise<void> => {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },
};
