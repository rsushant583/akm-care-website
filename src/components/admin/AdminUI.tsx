import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFiles: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  className?: string;
  label?: string;
};

export function ImageDropzone({
  onFiles,
  accept = "image/*,video/mp4",
  multiple = true,
  className,
  label = "Drag & drop images here, or click to browse",
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return;
      setBusy(true);
      try {
        await onFiles(Array.from(list));
      } finally {
        setBusy(false);
      }
    },
    [onFiles],
  );

  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors",
        dragging ? "border-orange-500 bg-orange-50" : "border-slate-300 bg-slate-50 hover:border-orange-400",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handle(e.dataTransfer.files);
      }}
    >
      <Upload className="text-orange-500" size={22} />
      <span className="text-sm text-slate-600">{busy ? "Uploading…" : label}</span>
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={busy}
        onChange={(e) => void handle(e.target.files)}
      />
    </label>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function AdminEmpty({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{message}</div>;
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400",
      )}
    >
      {children}
    </button>
  );
}

export function ImagePreviewList({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove?: (url: string) => void;
}) {
  if (!urls.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-white">
          <img src={url} alt="" className="h-full w-full object-cover" />
          {onRemove && (
            <button
              type="button"
              className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5"
              onClick={() => onRemove(url)}
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
