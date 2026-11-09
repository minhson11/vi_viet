/**
 * Tiện ích xử lý thông tin chuyển khoản & tạo link mã QR VietQR (Napas 247)
 */

export interface ExtractedBankInfo {
  bank: string;
  accountNumber: string;
  accountName: string;
  note: string;
}

/**
 * Trích xuất thông tin tài khoản ngân hàng từ chuỗi lý do hủy đơn/hoàn tiền
 * Định dạng: "[Hoàn tiền STK] Ngân hàng: ... | STK: ... | Chủ TK: ... | Lý do: ..."
 */
export function extractBankInfo(reasonStr: string): ExtractedBankInfo | null {
  if (!reasonStr || !reasonStr.includes("[Hoàn tiền STK]")) return null;
  const parts = reasonStr.replace("[Hoàn tiền STK]", "").split("|");
  const getVal = (prefix: string) => {
    const found = parts.find((p) => p.toLowerCase().includes(prefix.toLowerCase()));
    return found ? found.split(":")[1]?.trim() : "";
  };
  return {
    bank: getVal("Ngân hàng") || "Chưa rõ",
    accountNumber: getVal("STK") || "",
    accountName: getVal("Chủ TK") || "",
    note: getVal("Lý do") || "",
  };
}

/**
 * Ánh xạ tên ngân hàng thông dụng sang mã định danh chuẩn Napas / VietQR
 */
export function getBankCode(bankName: string): string {
  const b = (bankName || "").toUpperCase();
  if (b.includes("MB")) return "MB";
  if (b.includes("VIETCOM") || b.includes("VCB")) return "VCB";
  if (b.includes("TECHCOM") || b.includes("TCB")) return "TCB";
  if (b.includes("VPBANK") || b.includes("VPB")) return "VPB";
  if (b.includes("VIETIN") || b.includes("CTG") || b.includes("ICB")) return "ICB";
  if (b.includes("BIDV")) return "BIDV";
  if (b.includes("ACB")) return "ACB";
  if (b.includes("TPBANK") || b.includes("TPB")) return "TPB";
  if (b.includes("SACOM") || b.includes("STB")) return "STB";
  if (b.includes("VIB")) return "VIB";
  if (b.includes("HDBANK") || b.includes("HDB")) return "HDB";
  if (b.includes("SHB")) return "SHB";
  if (b.includes("SEABANK")) return "SEAB";
  if (b.includes("MSB")) return "MSB";
  if (b.includes("OCB")) return "OCB";
  if (b.includes("TIMO")) return "TIMO";
  return "MB"; // Mặc định MB Bank
}

/**
 * Tạo link ảnh QuickLink VietQR theo chuẩn Napas 247
 */
export function generateVietQRUrl(params: {
  bankName: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  description: string;
}): string {
  const code = getBankCode(params.bankName);
  const accNo = encodeURIComponent(params.accountNumber.trim());
  const template = "compact2";
  const amount = Math.round(params.amount);
  const desc = encodeURIComponent(params.description.slice(0, 50));
  const accName = params.accountName ? encodeURIComponent(params.accountName.trim()) : "";

  return `https://img.vietqr.io/image/${code}-${accNo}-${template}.png?amount=${amount}&addInfo=${desc}&accountName=${accName}`;
}
