"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { userProfileApi } from "@/features/auth/api/user-profile.api";

const SPICY_OPTIONS = ["Không ăn cay", "Cay nhẹ", "Cay vừa", "Rất cay"];
const DIETARY_OPTIONS = [
  "Ít dầu mỡ / Nước trong",
  "Nhiều hành hoa",
  "Không ăn hành lá",
  "Không bột ngọt",
  "Ít đường",
  "Ăn chay định kỳ",
];

export default function AccountPreferencesPage() {
  const [spicyLevel, setSpicyLevel] = useState<number>(1);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const pref = await userProfileApi.getPreferences();
        if (pref) {
          if (typeof pref.spicy_level === "number") {
            setSpicyLevel(pref.spicy_level);
          }
          if (Array.isArray(pref.dietary_flags)) {
            setSelectedFlags(pref.dietary_flags);
          }
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const toggleFlag = (flag: string) => {
    setSelectedFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await userProfileApi.updatePreferences({
        spicy_level: spicyLevel,
        dietary_flags: selectedFlags,
      });
      setSuccessMsg("Đã lưu khẩu vị ẩm thực thành công!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-ink flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-turmeric" />
          <span>Sở thích & Khẩu vị ẩm thực</span>
        </h1>
        <p className="text-xs text-ink-muted">
          Bếp Mẹ sẽ ghi nhớ khẩu vị của bạn để tự động điều chỉnh gia vị và gợi ý món ăn chuẩn gu
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-ink-muted">
          Đang nạp khẩu vị của bạn...
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink block mb-2">
              Mức độ ăn cay thường ngày:
            </label>
            <div className="flex flex-wrap gap-2">
              {SPICY_OPTIONS.map((sp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSpicyLevel(i)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    spicyLevel === i
                      ? "border-brand-red bg-brand-red text-cream"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink block mb-2">
              Thói quen nêm nếm gia vị:
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((pref) => {
                const isSelected = selectedFlags.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleFlag(pref)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? "border-brand-red bg-brand-red/10 text-brand-red font-semibold"
                        : "border-border bg-surface hover:bg-surface-hover"
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu sở thích"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
