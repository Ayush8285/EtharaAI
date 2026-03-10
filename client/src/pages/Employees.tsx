import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CalendarCheck, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Employee } from '../types';
import { fetchEmployees, createEmployee, deleteEmployee } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

interface FormData {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
}

const emptyForm: FormData = { employeeId: '', fullName: '', email: '', department: '' };

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      setEmployees(await fetchEmployees());
    } catch {
      setError('Could not load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.employeeId.trim()) errs.employeeId = 'Required';
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.department.trim()) errs.department = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createEmployee({
        employeeId: form.employeeId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
      });
      toast.success('Employee added');
      setShowModal(false);
      setForm(emptyForm);
      setFormErrors({});
      loadEmployees();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget._id);
      toast.success(deleteTarget.fullName + ' removed');
      setDeleteTarget(null);
      loadEmployees();
    } catch {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setFormErrors({});
  };

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <ErrorState message={error} onRetry={loadEmployees} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your team directory</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees yet" description="Add your first employee to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp, i) => (
                  <tr key={emp._id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm font-medium text-slate-900">{emp.employeeId}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-700">{emp.fullName}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-500">{emp.email}</td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{emp.department}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate('/attendance?emp=' + emp.employeeId)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Attendance
                        </button>
                        <button onClick={() => setDeleteTarget(emp)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Add New Employee</h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <input type="text" value={form.employeeId} onChange={(e) => setForm(prev => ({ ...prev, employeeId: e.target.value }))} placeholder="e.g. EMP001" className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${formErrors.employeeId ? 'border-red-300' : 'border-slate-300'}`} />
                {formErrors.employeeId && <p className="mt-1 text-xs text-red-500">{formErrors.employeeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="e.g. Rahul Sharma" className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${formErrors.fullName ? 'border-red-300' : 'border-slate-300'}`} />
                {formErrors.fullName && <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="e.g. rahul@company.com" className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${formErrors.email ? 'border-red-300' : 'border-slate-300'}`} />
                {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input type="text" value={form.department} onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))} placeholder="e.g. Engineering" className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${formErrors.department ? 'border-red-300' : 'border-slate-300'}`} />
                {formErrors.department && <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        message={'Are you sure you want to delete ' + (deleteTarget?.fullName || '') + '? This will also remove all their attendance records.'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
