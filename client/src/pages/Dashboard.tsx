import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock, ArrowRight } from 'lucide-react';
import type { DashboardData, Employee } from '../types';
import { fetchDashboard } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchDashboard());
    } catch {
      setError('Failed to load dashboard. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;
  if (!data) return null;

  // each stat card gets its own color scheme
  const cards = [
    {
      label: 'Total Employees', value: data.totalEmployees, icon: Users,
      bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-100',
    },
    {
      label: 'Present Today', value: data.todayPresent, icon: UserCheck,
      bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100',
    },
    {
      label: 'Absent Today', value: data.todayAbsent, icon: UserX,
      bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', border: 'border-red-100',
    },
    {
      label: 'Not Marked', value: data.todayNotMarked, icon: Clock,
      bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">Quick snapshot of today's HR activity.</p>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{c.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{c.value}</p>
              </div>
              <div className={`rounded-xl ${c.iconBg} p-3`}>
                <c.icon className={`h-6 w-6 ${c.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* today's attendance list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Today's Attendance</h3>
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {data.todayAttendance.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No attendance marked yet"
            description="Head over to the Attendance page to start recording today's attendance."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Employee</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.todayAttendance.map((record) => {
                  const emp = typeof record.employee === 'object' ? (record.employee as Employee) : null;
                  return (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{emp?.fullName ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{emp?.employeeId}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-600">
                        {emp?.department ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                          ${record.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
