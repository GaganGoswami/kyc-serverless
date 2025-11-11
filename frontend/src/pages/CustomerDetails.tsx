import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { kycApi } from '../api';
import { KYCStatus, KYCEvent } from '../config';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  UserCheck,
  FileCheck,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

const WORKFLOW_STAGES = [
  {
    id: 1,
    name: 'Document Validation',
    eventType: 'Document.Validated',
    icon: FileCheck,
    description: 'Validates document format and quality',
    color: 'blue',
  },
  {
    id: 2,
    name: 'Identity Verification',
    eventType: 'Identity.Verified',
    icon: UserCheck,
    description: 'Verifies customer identity',
    color: 'purple',
  },
  {
    id: 3,
    name: 'Fraud Detection',
    eventType: 'Fraud.Checked',
    icon: Shield,
    description: 'Checks for fraudulent activity',
    color: 'orange',
  },
  {
    id: 4,
    name: 'Compliance Reporting',
    eventType: 'Compliance.Completed',
    icon: FileText,
    description: 'Generates final compliance report',
    color: 'green',
  },
];

const STATUS_CONFIG = {
  PENDING: { color: 'yellow', icon: Clock, text: 'Pending' },
  VALIDATED: { color: 'blue', icon: CheckCircle, text: 'Validated' },
  VERIFIED: { color: 'purple', icon: CheckCircle, text: 'Verified' },
  COMPLETED: { color: 'green', icon: CheckCircle, text: 'Completed' },
  FAILED: { color: 'red', icon: XCircle, text: 'Failed' },
  FRAUD_DETECTED: { color: 'red', icon: AlertTriangle, text: 'Fraud Detected' },
};

function CustomerDetails() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['customerDetails', customerId],
    queryFn: () => kycApi.getKycById(customerId!),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !records) {
    return (
      <div className="card">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <XCircle className="h-5 w-5 mr-2" />
          <span>Error loading customer details. Please try again.</span>
        </div>
      </div>
    );
  }

  // Sort records by timestamp
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
  );

  // Get latest status
  const latestRecord = sortedRecords[sortedRecords.length - 1];
  const currentStatus = latestRecord?.kycStatus || 'PENDING';
  const StatusIcon = STATUS_CONFIG[currentStatus as KYCStatus]?.icon || Clock;

  // Calculate workflow progress
  const completedStages = WORKFLOW_STAGES.filter((stage) =>
    records.some((record: KYCEvent) => record.eventType === stage.eventType)
  );

  const currentStageIndex = completedStages.length;
  const progressPercentage = (currentStageIndex / WORKFLOW_STAGES.length) * 100;

  // Find document URL (from first record)
  const documentUrl = records.find((r: KYCEvent) => r.documentUrl)?.documentUrl;

  // Find compliance report
  const complianceReport = records.find(
    (r: KYCEvent) => r.eventType === 'Compliance.Completed' && r.documentUrl?.includes('reports/')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Customer: {customerId}
            </h1>
            <div className="flex items-center mt-2 space-x-2">
              <StatusIcon className={`h-5 w-5 text-${STATUS_CONFIG[currentStatus as KYCStatus]?.color}-600`} />
              <span className={`text-sm font-medium text-${STATUS_CONFIG[currentStatus as KYCStatus]?.color}-600`}>
                {STATUS_CONFIG[currentStatus as KYCStatus]?.text}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • Last updated: {format(new Date(latestRecord.lastUpdated), 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workflow Progress
            </h2>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {currentStageIndex} of {WORKFLOW_STAGES.length} stages completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Workflow Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOW_STAGES.map((stage, index) => {
            const stageRecord = records.find((r: KYCEvent) => r.eventType === stage.eventType);
            const isCompleted = !!stageRecord;
            const isCurrent = index === currentStageIndex && currentStatus !== 'COMPLETED' && currentStatus !== 'FAILED';
            const isPending = index > currentStageIndex;

            const StageIcon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? `border-${stage.color}-500 bg-${stage.color}-50 dark:bg-${stage.color}-900/20`
                    : isCurrent
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 animate-pulse'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                {/* Stage Number Badge */}
                <div
                  className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted
                      ? `bg-${stage.color}-500 text-white`
                      : isCurrent
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : stage.id}
                </div>

                <div className="flex items-start space-x-3">
                  <StageIcon
                    className={`h-6 w-6 flex-shrink-0 ${
                      isCompleted
                        ? `text-${stage.color}-600`
                        : isCurrent
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {stage.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stage.description}
                    </p>

                    {isCompleted && stageRecord && (
                      <div className="mt-2 space-y-1">
                        {stageRecord.verificationScore && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Score: <span className="font-medium">{(stageRecord.verificationScore * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        {stageRecord.fraudScore !== undefined && (
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Risk: <span className="font-medium">{(stageRecord.fraudScore * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(stageRecord.lastUpdated), 'HH:mm:ss')}
                        </div>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="mt-2 flex items-center text-xs text-primary-600 dark:text-primary-400">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </div>
                    )}

                    {isPending && (
                      <div className="mt-2 text-xs text-gray-400">
                        Waiting...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents and Reports */}
      {(documentUrl || complianceReport) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Documents & Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentUrl && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Uploaded Document
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {documentUrl.split('/').pop()?.substring(0, 30)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(documentUrl, '_blank')}
                  className="btn-secondary text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  View
                </button>
              </div>
            )}

            {complianceReport && (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Compliance Report
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Final KYC report available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(complianceReport.documentUrl, '_blank')}
                  className="btn-primary text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Event Timeline
        </h2>
        <div className="space-y-4">
          {sortedRecords.map((record, index) => {
            const isLast = index === sortedRecords.length - 1;
            const stage = WORKFLOW_STAGES.find((s) => s.eventType === record.eventType);
            const StageIcon = stage?.icon || FileText;

            return (
              <div key={`${record.eventType}-${index}`} className="relative flex items-start space-x-4">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${stage?.color || 'gray'}-100 dark:bg-${stage?.color || 'gray'}-900/30 flex items-center justify-center z-10`}>
                  <StageIcon className={`h-5 w-5 text-${stage?.color || 'gray'}-600`} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {record.eventType}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(new Date(record.lastUpdated), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                      <span className={`status-badge status-${record.kycStatus.toLowerCase()}`}>
                        {record.kycStatus}
                      </span>
                    </div>

                    {/* Scores */}
                    {(record.verificationScore || record.fraudScore !== undefined) && (
                      <div className="mt-3 flex items-center space-x-4 text-sm">
                        {record.verificationScore && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Verification Score: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {(record.verificationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {record.fraudScore !== undefined && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Fraud Risk: </span>
                            <span className={`font-semibold ${record.fraudScore > 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                              {(record.fraudScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    {record.metadata && (
                      <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {record.metadata}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              Workflow Information
            </p>
            <p>
              The KYC workflow runs automatically through AWS Step Functions. Once a document is uploaded,
              it progresses through all 4 stages sequentially. Each stage typically takes 1-2 seconds to complete.
              The page auto-refreshes every 5 seconds to show real-time progress.
            </p>
            {currentStatus === 'VALIDATED' && currentStageIndex < WORKFLOW_STAGES.length && (
              <p className="mt-2 text-blue-700 dark:text-blue-300 font-medium">
                ⏳ Your document is being processed. Next stage: {WORKFLOW_STAGES[currentStageIndex]?.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetails;
