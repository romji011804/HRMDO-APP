export interface OjtStudentRecord {
  id: string;
  createdAt: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  program: string;
  school: string;
  ojtHours?: string;
  startDate?: string;
  endDate?: string;
  office?: string;
  address?: string;
  qrLink?: string;
}

export interface OjtQrRecord {
  id: string;
  createdAt: string;
  program: string;
  school: string;
  year: number;
  fileUrl: string;
  qrImageFile?: string;
  qrImageFileName?: string;
}

export interface OjtSettings {
  templateFile?: string;
  templateFileName?: string;
}

export interface OjtSavedCertificateRecord {
  id: string;
  studentId: string;
  savedAt: string;
  studentName: string;
  school: string;
  hoursLabel: string;
  dateRangeLabel: string;
  officeLine: string;
  issuedLine: string;
  templateFileName?: string;
  qrIncluded: boolean;
}

export interface OjtDashboardStats {
  studentCount: number;
  qrCodeCount: number;
  schoolCounts: Array<{ label: string; total: number }>;
  topPrograms: Array<{ label: string; total: number }>;
  topOffices: Array<{ label: string; total: number }>;
}
