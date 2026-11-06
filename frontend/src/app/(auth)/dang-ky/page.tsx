"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { httpClient } from "@/lib/http/client";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import {
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Phone,
  Lock,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

// Regex chuẩn số điện thoại di động Việt Nam (10 số, đầu số 03, 05, 07, 08, 09 hoặc mã quốc tế +84)
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

// Regex chuẩn email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Field touched states (để chỉ hiển thị lỗi sau khi người dùng đã tương tác)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Phân tích điều kiện mật khẩu an toàn
  const passwordCriteria = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let strengthScore = 0;
    if (hasLength) strengthScore += 1;
    if (hasLetter) strengthScore += 1;
    if (hasNumber) strengthScore += 1;
    if (hasSpecial) strengthScore += 1;

    const isSecure = hasLength && hasLetter && hasNumber;

    return {
      hasLength,
      hasLetter,
      hasNumber,
      hasSpecial,
      isSecure,
      strengthScore,
    };
  }, [password]);

  // Kiểm tra tính hợp lệ từng trường dữ liệu (Client-side validation)
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // 1. Họ và tên
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Họ và tên không được để trống";
    } else if (trimmedName.length < 2) {
      errors.fullName = "Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự)";
    }

    // 2. Số điện thoại
    const cleanedPhone = phone.trim().replace(/[\s.-]/g, "");
    if (!cleanedPhone) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!VN_PHONE_REGEX.test(cleanedPhone)) {
      errors.phone =
        "Số điện thoại không đúng định dạng (VD: 0901234567 hoặc +84901234567)";
    }

    // 3. Email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email không được để trống";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = "Địa chỉ email không đúng định dạng (VD: tenban@example.com)";
    }

    // 4. Mật khẩu
    if (!password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 8) {
      errors.password = "Mật khẩu phải chứa ít nhất 8 ký tự";
    } else if (!passwordCriteria.hasLetter || !passwordCriteria.hasNumber) {
      errors.password = "Mật khẩu phải bao gồm cả chữ cái và chữ số";
    }

    // 5. Xác nhận mật khẩu
    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng nhập lại mật khẩu xác nhận";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
    }

    return errors;
  }, [fullName, phone, email, password, confirmPassword, passwordCriteria]);

  // Làm sạch số điện thoại khi nhập (tự động bỏ khoảng cách và dấu gạch)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Cho phép nhập số và dấu + ở đầu
    const cleaned = raw.replace(/[^\d+]/g, "");
    setPhone(cleaned);
  };

  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Đánh dấu tất cả trường đã chạm để hiển thị toàn bộ lỗi nếu có
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      const firstError = Object.values(validationErrors)[0];
      setServerError(firstError || "Vui lòng hoàn thiện đúng các thông tin yêu cầu.");
      return;
    }

    setIsLoading(true);
    setServerError(null);

    const cleanedPhone = phone.trim().replace(/[\s.-]/g, "");

    try {
      await httpClient.post("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanedPhone,
        password,
      });

      router.push("/dang-nhap?registered=true");
    } catch (err: any) {
      setServerError(
        err.message ||
          "Không thể đăng ký tài khoản. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
      {/* Tiêu đề & Lời chào thương hiệu */}
      <div className="text-center space-y-1 mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-turmeric/10 text-turmeric border border-turmeric/20 text-[11px] font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-turmeric" />
          <span>Thẻ Hội Viên Ẩm Thực Vị Việt</span>
        </div>
        <h1 className="text-2xl font-bold font-headline text-ink">
          Đăng ký thành viên
        </h1>
        <p className="text-xs text-ink-muted">
          Trở thành hội viên để tích điểm thưởng và tận hưởng ưu đãi ẩm thực độc quyền
        </p>
      </div>

      {/* Thông báo lỗi tổng hợp từ máy chủ hoặc biểu mẫu */}
      {serverError && (
        <div className="p-3 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{serverError}</span>
        </div>
      )}

      {/* 1. Họ và tên */}
      <Input
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={() => markTouched("fullName")}
        error={touched.fullName ? validationErrors.fullName : undefined}
        required
      />

      {/* 2. Số điện thoại chuẩn Việt Nam */}
      <Input
        label="Số điện thoại di động"
        type="tel"
        placeholder="0901234567 hoặc +84..."
        value={phone}
        onChange={handlePhoneChange}
        onBlur={() => markTouched("phone")}
        helperText={
          !touched.phone || !validationErrors.phone
            ? "Định dạng 10 số (VD: 0901234567, 098..., 038...)"
            : undefined
        }
        error={touched.phone ? validationErrors.phone : undefined}
        required
      />

      {/* 3. Địa chỉ Email */}
      <Input
        label="Địa chỉ Email"
        type="email"
        placeholder="tenban@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => markTouched("email")}
        error={touched.email ? validationErrors.email : undefined}
        required
      />

      {/* 4. Mật khẩu với Checklist an toàn & Nút Ẩn/Hiện */}
      <div className="space-y-2">
        <Input
          label="Mật khẩu"
          type={showPassword ? "text" : "password"}
          placeholder="Tối thiểu 8 ký tự (gồm chữ và số)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched("password")}
          error={touched.password ? validationErrors.password : undefined}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ink-muted hover:text-ink transition-colors p-1 cursor-pointer focus:outline-none"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-ink-muted" />
              ) : (
                <Eye className="w-4 h-4 text-ink-muted" />
              )}
            </button>
          }
        />

        {/* Thanh tiêu chuẩn an toàn mật khẩu (Checklist) */}
        {password.length > 0 && (
          <div className="p-3 bg-[#fdfcf9] border border-border/80 rounded-xl space-y-2 text-xs">
            {/* Thanh đo độ mạnh mật khẩu */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-ink-muted">
                Độ mạnh:
              </span>
              <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5">
                <div
                  className={`rounded-full transition-colors ${
                    passwordCriteria.strengthScore >= 1
                      ? passwordCriteria.strengthScore <= 2
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                      : "bg-red-400"
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    passwordCriteria.strengthScore >= 2
                      ? passwordCriteria.strengthScore === 2
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    passwordCriteria.strengthScore >= 3
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    passwordCriteria.strengthScore >= 4
                      ? "bg-emerald-600"
                      : "bg-gray-200"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-bold ${
                  passwordCriteria.isSecure
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {passwordCriteria.strengthScore >= 3
                  ? "Rất mạnh"
                  : passwordCriteria.isSecure
                  ? "Hợp lệ"
                  : "Chưa đủ"}
              </span>
            </div>

            {/* Điều kiện bắt buộc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <div
                className={`flex items-center gap-1.5 ${
                  passwordCriteria.hasLength
                    ? "text-emerald-600 font-medium"
                    : "text-ink-muted"
                }`}
              >
                {passwordCriteria.hasLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-ink-muted/50 font-bold">
                    •
                  </span>
                )}
                <span>Tối thiểu 8 ký tự</span>
              </div>

              <div
                className={`flex items-center gap-1.5 ${
                  passwordCriteria.hasLetter && passwordCriteria.hasNumber
                    ? "text-emerald-600 font-medium"
                    : "text-ink-muted"
                }`}
              >
                {passwordCriteria.hasLetter && passwordCriteria.hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-ink-muted/50 font-bold">
                    •
                  </span>
                )}
                <span>Có cả chữ cái và số</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Nhập lại mật khẩu (Xác nhận mật khẩu) */}
      <Input
        label="Xác nhận mật khẩu"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Nhập lại mật khẩu vừa đặt"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={() => markTouched("confirmPassword")}
        error={
          touched.confirmPassword ? validationErrors.confirmPassword : undefined
        }
        required
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-ink-muted hover:text-ink transition-colors p-1 cursor-pointer focus:outline-none"
            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4 text-ink-muted" />
            ) : (
              <Eye className="w-4 h-4 text-ink-muted" />
            )}
          </button>
        }
      />

      {/* Nút hành động Đăng ký */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2 cursor-pointer shadow-sm hover:shadow-md transition-all font-semibold"
        isLoading={isLoading}
      >
        Tạo tài khoản hội viên
      </Button>

      {/* Chuyển hướng Đăng nhập */}
      <SocialAuthButtons />

      <div className="pt-2 text-center text-xs text-ink-muted border-t border-border/50">
        Đã có tài khoản Vị Việt?{" "}
        <Link
          href="/dang-nhap"
          className="text-brand-red font-semibold hover:underline cursor-pointer"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
