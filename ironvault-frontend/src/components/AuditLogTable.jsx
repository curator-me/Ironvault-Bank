import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const AuditLogTable = ({ logs = [], emptyText = 'No audit logs found' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg border border-navy-100 shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-navy-50 border-b border-navy-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Performed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Date/Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <ClipboardList className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                  <p className="text-navy-600">{emptyText}</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-navy-900 whitespace-nowrap">{log.id}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-navy-100 text-navy-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-navy-900 whitespace-nowrap">
                    {log.performedBy || 'SYSTEM'}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-600 max-w-md break-words">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-600 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AuditLogTable;