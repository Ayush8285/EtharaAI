import axios from 'axios';
import type { Employee, AttendanceRecord, DashboardData } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// employees

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await api.get('/api/employees');
  return res.data.data;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const res = await api.get(`/api/employees/${id}`);
  return res.data.data;
}

export async function createEmployee(
  employee: Omit<Employee, '_id' | 'createdAt'>
): Promise<Employee> {
  const res = await api.post('/api/employees', employee);
  return res.data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/api/employees/${id}`);
}

// attendance

export async function markAttendance(payload: {
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent';
}): Promise<AttendanceRecord> {
  const res = await api.post('/api/attendance', payload);
  return res.data.data;
}

export async function fetchAttendance(
  employeeId: string,
  filters?: { from?: string; to?: string }
): Promise<{ records: AttendanceRecord[]; summary: { totalPresent: number; totalAbsent: number } }> {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  const qs = params.toString();
  const res = await api.get(`/api/attendance/employee/${employeeId}${qs ? '?' + qs : ''}`);
  return { records: res.data.data, summary: res.data.summary };
}

// dashboard

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await api.get('/api/dashboard');
  return res.data.data;
}
