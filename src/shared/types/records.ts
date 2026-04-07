export type BaseRecord = {
  id: string;
  date: string;
  createdAt: string;
};

export type MOARecord = BaseRecord & {
  controlNumber: string;
  school: string;
  course: string;
  year?: number;
  status: "Ongoing" | "Completed";
  workflow: string;
  hours?: string;
  dateReceived?: string;
  moaValue?: string;
  moaFileName?: string;
  moaType?: "file" | "link";
  moaDate?: string;
  legalOpinionValue?: string;
  legalOpinionFileName?: string;
  legalOpinionType?: "file" | "link";
  legalOpinionDate?: string;
  updatedAt?: string;
};

export type OJTRecord = BaseRecord & {
  studentName: string;
  company: string;
  school: string;
  program?: string;
  status: "complete" | "missing";
  certificateFile?: string;
  certificateFileName?: string;
  notes?: string;
};

export type OJTQrCodeRecord = BaseRecord & {
  program: string;
  school: string;
  year: number;
  fileUrl: string;
  qrImageFile?: string;
  qrImageFileName?: string;
};
