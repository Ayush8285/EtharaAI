import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import type { DashboardData, Employee } from '../types';
import { fetchDashboard } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchDashboard());
    } catch {
      setError('Failed to load dashboard data');
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

  const stats = [
    { label: 'Total Employees', value: data.totalEmployees, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-200' },
    { label: 'Present Today', value: data.todayPresent, icon: UserCheck, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-200' },
    { label: 'Absent Today', value: data.todayAbsent, icon: UserX, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-200' },
    { label: 'Not Marked', value: data.todayNotMarked, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-200' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Overview of today's HR metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
              </div>
              <div className={`rounded-lg ${s.bg} p-3`}>
                <s.icon className={`h-6 w-6 ${s.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* today's attendance */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">Today's Attendance</h3>
        </div>

        {data.todayAttendance.length === 0 ? (
          <EmptyState icon={Clock} title="No attendance yet" description="No one has been marked present or absent today." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.todayAttendance.map((record, i) => {
                  const emp = typeof record.employee === 'object' ? record.employee as Employee : null;
                  return (
                    <tr key={record._id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{emp?.fullName ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{emp?.employeeId}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-600">{emp?.department ?? '-'}</td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
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
