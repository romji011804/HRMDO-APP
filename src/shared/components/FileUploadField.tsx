import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "../../app/components/ui/button";

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  fileName?: string;
  onSelect: (file?: File) => void;
}

export function FileUploadField({ label, accept, fileName, onSelect }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload file
        </Button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {fileName?.trim() ? fileName : "No file selected"}
        </span>
      </div>
    </div>
  );
}
