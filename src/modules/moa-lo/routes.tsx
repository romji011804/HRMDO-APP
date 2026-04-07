import { AddRecord } from "../../app/components/AddRecord";
import { ImportExport } from "../../app/components/ImportExport";
import { Reports } from "../../app/components/Reports";
import { ViewRecords } from "../../app/components/ViewRecords";
import { ViewSingleRecord } from "../../app/components/ViewSingleRecord";

export const moaLoRoutes = [
  { path: "moa-lo/add-record", Component: AddRecord },
  { path: "moa-lo/view-records", Component: ViewRecords },
  { path: "moa-lo/record/:id", Component: ViewSingleRecord },
  { path: "moa-lo/import-export", Component: ImportExport },
  { path: "moa-lo/reports", Component: Reports },
];
