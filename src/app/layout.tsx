import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NeedWork — Tìm việc & Tuyển dụng minh bạch",
  description:
    "Mạng xã hội tuyển dụng công bằng — ứng viên và nhà tuyển dụng đánh giá nhau trực tiếp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
