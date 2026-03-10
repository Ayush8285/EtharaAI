export interface Employee {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  employee: string | Employee;
  date: string;
  status: 'Present' | 'Absent';
}

export interface DashboardData {
  totalEmployees: number;
  todayPresent: number;
  todayAbsent: number;
  todayNotMarked: number;
  todayAttendance: AttendanceRecord[];
}
