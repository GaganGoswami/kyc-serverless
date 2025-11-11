import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { kycApi } from '../api';
import { KYCStatus } from '../config';
import { AlertCircle, CheckCircle, Clock, XCircle, TrendingUp, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<KYCStatus, string> = {
  PENDING: 'status-pending',
  VALIDATED: 'status-validated',
  VERIFIED: 'status-verified',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
  FRAUD_DETECTED: 'status-fraud',
};

const STATUS_ICONS: Record<KYCStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  VALIDATED: <CheckCircle className="h-4 w-4" />,
  VERIFIED: <CheckCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
  FRAUD_DETECTED: <AlertCircle className="h-4 w-4" />,
};

function Dashboard() {
  const navigate = useNavigate();
  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['kycRecords'],
    queryFn: () => kycApi.getKycRecords(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Calculate statistics
  const stats = records?.reduce(
    (acc, record) => {
      if (!acc.byStatus[record.kycStatus]) {
        acc.byStatus[record.kycStatus] = 0;
      }
      acc.byStatus[record.kycStatus]++;
      acc.total++;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number> }
  );

  // Group records by customer
  const customerRecords = records?.reduce((acc, record) => {
    if (!acc[record.customerId]) {
      acc[record.customerId] = [];
    }
    acc[record.customerId].push(record);
    return acc;
  }, {} as Record<string, typeof records>);

  // Get latest status for each customer
  const customerStatuses = Object.entries(customerRecords || {}).map(([_, events]) => {
    const sortedEvents = events.sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    return sortedEvents[0];
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error loading KYC records. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KYC Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor and manage KYC verification workflows
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.total || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats?.byStatus.COMPLETED || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats?.byStatus.PENDING || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed/Fraud</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {(stats?.byStatus.FAILED || 0) + (stats?.byStatus.FRAUD_DETECTED || 0)}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* KYC Records Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent KYC Verifications
        </h2>
        
        {customerStatuses.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No KYC records</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by uploading a document.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {customerStatuses.map((record) => (
                  <tr 
                    key={`${record.customerId}-${record.eventType}`} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customer/${record.customerId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      {record.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${STATUS_COLORS[record.kycStatus]}`}>
                        {STATUS_ICONS[record.kycStatus]}
                        <span className="ml-2">{record.kycStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {record.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {record.verificationScore ? 
                        `${(record.verificationScore * 100).toFixed(0)}%` : 
                        record.fraudScore ? 
                        `Risk: ${(record.fraudScore * 100).toFixed(0)}%` : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(record.lastUpdated), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
