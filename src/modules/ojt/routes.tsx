import { AddOjtRecord, OjtStudentsScreen } from "./components/AddRecord";
import { OjtCertificateViewer } from "./components/CertificateViewer";
import { OjtDashboard } from "./components/Dashboard";
import { OjtImportExport } from "./components/ImportExport";
import { OjtReports } from "./components/Reports";
import { OjtCertificatesScreen, ViewOjtRecords } from "./components/ViewRecords";

export const ojtRoutes = [
  { path: "ojt", Component: OjtDashboard },
  { path: "ojt/add-student", Component: OjtStudentsScreen },
  { path: "ojt/view-students", Component: OjtStudentsScreen },
  { path: "ojt/students", Component: OjtStudentsScreen },
  { path: "ojt/certificates", Component: OjtCertificatesScreen },
  { path: "ojt/certificates/view", Component: OjtCertificateViewer },
  { path: "ojt/add-record", Component: AddOjtRecord },
  { path: "ojt/view-records", Component: ViewOjtRecords },
  { path: "ojt/import-export", Component: OjtImportExport },
  { path: "ojt/reports", Component: OjtReports },
];
