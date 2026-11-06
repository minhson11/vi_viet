"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { parseApiErrorMessage } from "@/lib/http/errors";
import { adminCatalogApi } from "../api/admin-catalog.api";
import type { MenuImportPreview, MenuImportResult } from "../types";

interface MenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function MenuImportModal({
  isOpen,
  onClose,
  onSuccess,
}: MenuImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MenuImportPreview | null>(null);
  const [result, setResult] = useState<MenuImportResult | null>(null);
  const [error, setError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  const close = () => {
    if (isPreviewing || isImporting) return;
    reset();
    onClose();
  };

  const downloadTemplate = async () => {
    setIsDownloading(true);
    setError("");
    try {
      const blob = await adminCatalogApi.downloadMenuImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mau-import-thuc-don.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  };

  const previewFile = async () => {
    if (!file) return;
    setIsPreviewing(true);
    setError("");
    setResult(null);
    try {
      setPreview(await adminCatalogApi.previewMenuImport(file));
    } catch (err) {
      setPreview(null);
      setError(parseApiErrorMessage(err));
    } finally {
      setIsPreviewing(false);
    }
  };

  const importFile = async () => {
    if (!file || !preview?.valid) return;
    setIsImporting(true);
    setError("");
    try {
      const imported = await adminCatalogApi.importMenu(file);
      setResult(imported);
      await onSuccess();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Import thực đơn bằng Excel"
      description="Một sheet THUC_DON hỗ trợ đầy đủ món, biến thể, nguyên liệu, thẻ, ảnh và tùy chọn."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {result ? "Đóng" : "Hủy"}
          </Button>
          {!result && (
            <Button
              variant="primary"
              onClick={preview?.valid ? importFile : previewFile}
              isLoading={preview?.valid ? isImporting : isPreviewing}
              disabled={!file || Boolean(preview && !preview.valid)}
            >
              {preview?.valid ? "Xác nhận import" : "Kiểm tra file"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-hover/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">File mẫu chuẩn</p>
            <p className="mt-1 text-xs text-ink-muted">
              Mỗi dòng chọn một loại dữ liệu. Chỉ nhận .xlsx, tối đa 5 MB.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            isLoading={isDownloading}
          >
            <Download className="h-4 w-4" />
            Tải file mẫu
          </Button>
        </div>

        {!result && (
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5">
            <FileSpreadsheet className="mx-auto h-9 w-9 text-primary" />
            <span className="mt-2 block text-sm font-semibold text-ink">
              {file?.name || "Chọn file thực đơn"}
            </span>
            {file && (
              <span className="mt-1 block text-xs text-ink-muted">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setPreview(null);
                setResult(null);
                setError("");
              }}
            />
          </label>
        )}

        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Dòng", preview.summary.rows],
                ["Món", preview.summary.dishes],
                ["Tạo mới", preview.summary.create],
                ["Cập nhật", preview.summary.update],
                ["Không hợp lệ", preview.summary.invalid],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-ink-muted">{label}</p>
                  <p className="mt-1 text-xl font-bold text-ink">{value}</p>
                </div>
              ))}
            </div>

            {preview.valid ? (
              <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                File hợp lệ. Kiểm tra số liệu và nhấn xác nhận để import.
              </div>
            ) : (
              <div className="max-h-72 overflow-auto rounded-lg border border-red-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-red-50 text-red-800">
                    <tr>
                      <th className="px-3 py-2">Dòng</th>
                      <th className="px-3 py-2">Cột</th>
                      <th className="px-3 py-2">Lỗi</th>
                      <th className="px-3 py-2">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((item, index) => (
                      <tr key={`${item.row}-${item.column}-${index}`} className="border-t border-red-100">
                        <td className="px-3 py-2 font-medium">{item.row}</td>
                        <td className="px-3 py-2">{item.column}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{item.code}</td>
                        <td className="px-3 py-2">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h4 className="mt-2 font-bold text-emerald-900">Import thành công</h4>
            <p className="mt-1 text-sm text-emerald-700">
              Đã xử lý {result.imported} món: tạo mới {result.created}, cập nhật {result.updated}.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

