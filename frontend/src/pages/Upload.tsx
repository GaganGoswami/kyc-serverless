import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { kycApi } from '../api';
import { Upload as UploadIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react';

function UploadPage() {
  const [customerId, setCustomerId] = useState('');
  const [documentType, setDocumentType] = useState('passport');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !customerId) {
        throw new Error('Please provide customer ID and select a file');
      }

      setUploadStatus('uploading');

      // Get presigned URL
      const { uploadUrl } = await kycApi.getUploadUrl({
        customerId,
        documentType,
      });

      // Upload file to S3
      await kycApi.uploadFile(uploadUrl, file);

      setUploadStatus('success');
    },
    onError: (error: Error) => {
      setUploadStatus('error');
      setErrorMessage(error.message || 'Upload failed');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const resetForm = () => {
    setCustomerId('');
    setDocumentType('passport');
    setFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload KYC Document</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Upload customer documents to initiate the KYC verification process
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer ID */}
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer ID
            </label>
            <input
              type="text"
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g., customer-12345"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Document Type */}
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="passport">Passport</option>
              <option value="drivers-license">Driver's License</option>
              <option value="national-id">National ID</option>
              <option value="utility-bill">Utility Bill</option>
              <option value="bank-statement">Bank Statement</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary-500 transition-colors">
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="file"
                    className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, PNG, JPG up to 10MB
                </p>
                {file && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Document uploaded successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                  KYC verification process has been initiated. Check the dashboard for status updates.
                </p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  Upload failed
                </p>
                <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={uploadStatus === 'uploading'}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2 inline" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 mr-2 inline" />
                  Upload Document
                </>
              )}
            </button>

            {uploadStatus === 'success' && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Upload Another
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="mt-6 card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">
          What happens next?
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Document is validated for format and quality</li>
          <li>Identity verification extracts and validates information</li>
          <li>Fraud detection checks for suspicious indicators</li>
          <li>Compliance report is generated and stored</li>
          <li>Final KYC status is updated in the dashboard</li>
        </ol>
      </div>
    </div>
  );
}

export default UploadPage;
