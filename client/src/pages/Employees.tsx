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

interface FormFields {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
}

const blankForm: FormFields = { employeeId: '', fullName: '', email: '', department: '' };

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modal state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormFields>(blankForm);
  const [formErrors, setFormErrors] = useState<Partial<FormFields>>({});
  const [saving, setSaving] = useState(false);

  // delete confirmation
  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadList() {
    setLoading(true);
    setError('');
    try {
      setEmployees(await fetchEmployees());
    } catch {
      setError('Could not load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadList(); }, []);

  // basic client-side validation before we hit the API
  function validate(): boolean {
    const errs: Partial<FormFields> = {};
    if (!form.employeeId.trim()) errs.employeeId = 'Required';
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.department.trim()) errs.department = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await createEmployee({
        employeeId: form.employeeId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
      });
      toast.success('Employee added successfully');
      closeForm();
      loadList();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(toDelete._id);
      toast.success(`${toDelete.fullName} has been removed`);
      setToDelete(null);
      loadList();
    } catch {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setForm(blankForm);
    setFormErrors({});
  }

  // helper for consistent input styling
  function inputClass(field: keyof FormFields) {
    return `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
      formErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
    }`;
  }

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <ErrorState message={error} onRetry={loadList} />;

  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {employees.length} employee{employees.length !== 1 ? 's' : ''} in the directory
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* employee table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees yet" description="Click 'Add Employee' above to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm font-mono font-medium text-gray-900">{emp.employeeId}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-800">{emp.fullName}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">{emp.email}</td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-600/10">
                        {emp.department}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/attendance?emp=' + emp.employeeId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Attendance
                        </button>
                        <button
                          onClick={() => setToDelete(emp)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
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

      {/* add employee modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">New Employee</h3>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee ID</label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="e.g. EMP001"
                  className={inputClass('employeeId')}
                />
                {formErrors.employeeId && <p className="mt-1 text-xs text-red-500">{formErrors.employeeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={inputClass('fullName')}
                />
                {formErrors.fullName && <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. rahul@company.com"
                  className={inputClass('email')}
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  className={inputClass('department')}
                />
                {formErrors.department && <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* delete confirmation */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete Employee"
        message={`Are you sure you want to remove ${toDelete?.fullName || ''}? All their attendance records will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
