import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Employee, AttendanceRecord } from '../types';
import { fetchEmployees, markAttendance, fetchAttendance } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [empError, setEmpError] = useState('');

  // we track by employeeId string (like "EMP001"), not mongo _id
  const [selectedEmpId, setSelectedEmpId] = useState(searchParams.get('emp') || '');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState('');

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Present' | 'Absent'>('Present');
  const [submitting, setSubmitting] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadEmployees = async () => {
    setLoadingEmp(true);
    setEmpError('');
    try {
      setEmployees(await fetchEmployees());
    } catch {
      setEmpError('Failed to load employees');
    } finally {
      setLoadingEmp(false);
    }
  };

  const loadRecords = async () => {
    if (!selectedEmpId) return;
    setLoadingRecords(true);
    setRecordsError('');
    try {
      const filters: { from?: string; to?: string } = {};
      if (fromDate) filters.from = fromDate;
      if (toDate) filters.to = toDate;
      const result = await fetchAttendance(selectedEmpId, filters);
      setRecords(result.records);
    } catch {
      setRecordsError('Failed to load attendance records');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  useEffect(() => {
    if (selectedEmpId) {
      setSearchParams({ emp: selectedEmpId });
      loadRecords();
    } else {
      setSearchParams({});
      setRecords([]);
    }
  }, [selectedEmpId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedEmpId) loadRecords();
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !date) return;

    setSubmitting(true);
    try {
      await markAttendance({ employeeId: selectedEmpId, date, status });
      toast.success('Marked as ' + status);
      loadRecords();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    return { present, absent, total: records.length };
  }, [records]);

  const selectedEmployee = employees.find(e => e.employeeId === selectedEmpId);

  if (loadingEmp) return <LoadingSpinner message="Loading..." />;
  if (empError) return <ErrorState message={empError} onRetry={loadEmployees} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Attendance</h2>
        <p className="mt-1 text-sm text-slate-500">Track daily employee attendance</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee</label>
        <select
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <option value="">-- Choose an employee --</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp.employeeId}>
              {emp.fullName} ({emp.employeeId})
            </option>
          ))}
        </select>
      </div>

      {selectedEmpId && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Mark Attendance {selectedEmployee ? 'for ' + selectedEmployee.fullName : ''}
            </h3>
            <form onSubmit={handleMark} className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div className="flex gap-4">
                  {(['Present', 'Absent'] as const).map(val => (
                    <label key={val} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value={val} checked={status === val} onChange={() => setStatus(val)} className="h-4 w-4 text-indigo-600 border-slate-300" />
                      <span className="text-sm text-slate-700">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving...' : 'Mark Attendance'}
              </button>
            </form>
          </div>

          {records.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Present</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.present}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Absent</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.absent}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="h-6 w-6 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Records</p>
                    <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-900">Attendance History</h3>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">From</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-0.5">To</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {(fromDate || toDate) && (
                    <button onClick={() => { setFromDate(''); setToDate(''); }} className="mt-4 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingRecords ? (
              <LoadingSpinner message="Loading records..." />
            ) : recordsError ? (
              <ErrorState message={recordsError} onRetry={loadRecords} />
            ) : records.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="No records found" description="No attendance records for this employee yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((record, i) => {
                      const d = new Date(record.date);
                      return (
                        <tr key={record._id} className={i % 2 !== 0 ? 'bg-slate-50/30' : ''}>
                          <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-900">
                            {d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-500">
                            {d.toLocaleDateString('en-US', { weekday: 'long' })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {record.status === 'Present' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
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
        </>
      )}
    </div>
  );
}
