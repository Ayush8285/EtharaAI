import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle, XCircle, Filter } from 'lucide-react';
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

  // track by the human-readable employee ID (like "EMP001")
  const [selectedId, setSelectedId] = useState(searchParams.get('emp') || '');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState('');

  // form fields for marking attendance
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Present' | 'Absent'>('Present');
  const [submitting, setSubmitting] = useState(false);

  // date range filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  async function loadEmployees() {
    setLoadingEmp(true);
    setEmpError('');
    try {
      setEmployees(await fetchEmployees());
    } catch {
      setEmpError('Failed to load employees');
    } finally {
      setLoadingEmp(false);
    }
  }

  async function loadRecords() {
    if (!selectedId) return;
    setLoadingRecords(true);
    setRecordsError('');
    try {
      const filters: { from?: string; to?: string } = {};
      if (fromDate) filters.from = fromDate;
      if (toDate) filters.to = toDate;
      const result = await fetchAttendance(selectedId, filters);
      setRecords(result.records);
    } catch {
      setRecordsError('Failed to load attendance records');
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => { loadEmployees(); }, []);

  // re-fetch records when employee changes
  useEffect(() => {
    if (selectedId) {
      setSearchParams({ emp: selectedId });
      loadRecords();
    } else {
      setSearchParams({});
      setRecords([]);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // re-fetch when date filters change
  useEffect(() => {
    if (selectedId) loadRecords();
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMark(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !date) return;

    setSubmitting(true);
    try {
      await markAttendance({ employeeId: selectedId, date, status });
      toast.success(`Marked as ${status}`);
      loadRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  }

  // calculate summary from the current records
  const summary = useMemo(() => {
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    return { present, absent, total: records.length };
  }, [records]);

  const selectedEmployee = employees.find(e => e.employeeId === selectedId);

  if (loadingEmp) return <LoadingSpinner message="Loading..." />;
  if (empError) return <ErrorState message={empError} onRetry={loadEmployees} />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Select an employee to mark or view their attendance.</p>

      {/* employee picker */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">-- Choose an employee --</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp.employeeId}>
              {emp.fullName} ({emp.employeeId})
            </option>
          ))}
        </select>
      </div>

      {selectedId && (
        <>
          {/* mark attendance form */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              Mark Attendance{selectedEmployee ? ` — ${selectedEmployee.fullName}` : ''}
            </h3>
            <form onSubmit={handleMark} className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <div className="flex gap-5 py-2">
                  {(['Present', 'Absent'] as const).map(val => (
                    <label key={val} className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="status"
                        value={val}
                        checked={status === val}
                        onChange={() => setStatus(val)}
                        className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : 'Mark Attendance'}
              </button>
            </form>
          </div>

          {/* summary cards — only show when there are records */}
          {records.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.present}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.absent}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="h-6 w-6 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* attendance history table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-semibold text-gray-900">Attendance History</h3>
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => { setFromDate(''); setToDate(''); }}
                      className="mt-4 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      Clear filters
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
              <EmptyState icon={CalendarCheck} title="No records found" description="No attendance has been recorded for this employee yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Day</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record) => {
                      const d = new Date(record.date);
                      return (
                        <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-900">
                            {d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                            {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold
                              ${record.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                                : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
                              }`}
                            >
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
