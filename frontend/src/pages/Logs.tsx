import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { kycApi } from '../api';
import { AlertCircle, Search, Filter, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { KYCStatus } from '../config';

const STATUS_COLORS: Record<KYCStatus, string> = {
  PENDING: 'status-pending',
  VALIDATED: 'status-validated',
  VERIFIED: 'status-verified',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
  FRAUD_DETECTED: 'status-fraud',
};

function Logs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['kycLogs'],
    queryFn: () => kycApi.getKycRecords(),
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Filter records
  const filteredRecords = records?.filter((record) => {
    const matchesSearch = 
      record.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.metadata?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.kycStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort by most recent first
  const sortedRecords = filteredRecords?.sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

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
          <span>Error loading event logs. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Logs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View all KYC verification events and agent activity
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer ID, event type, or metadata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="VERIFIED">Verified</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="FRAUD_DETECTED">Fraud Detected</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <span>Showing {sortedRecords?.length || 0} of {records?.length || 0} events</span>
        </div>
      </div>

      {/* Event Log Table */}
      <div className="card">
        {sortedRecords && sortedRecords.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No events found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedRecords?.map((record, index) => (
                  <tr key={`${record.customerId}-${record.eventType}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(record.lastUpdated), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                      onClick={() => navigate(`/customer/${record.customerId}`)}
                    >
                      {record.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {record.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${STATUS_COLORS[record.kycStatus]}`}>
                        {record.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {record.metadata || 'No additional details'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/customer/${record.customerId}`)}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </button>
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

export default Logs;
