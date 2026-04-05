"use client";

import toast from "react-hot-toast";

function MailOutlineIcon() {
  return (
    <svg
      className="theme-mail-outline h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 7L10.6 12.3C11.43 13.02 12.57 13.02 13.4 12.3L19.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 17.6L10.2 12.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19.2 17.6L13.8 12.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MailSolidIcon() {
  return (
    <svg
      className="theme-mail-solid hidden h-6 w-6"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.75 6.25A2.75 2.75 0 0 0 2 9v6a2.75 2.75 0 0 0 2.75 2.75h14.5A2.75 2.75 0 0 0 22 15V9a2.75 2.75 0 0 0-2.75-2.75H4.75Zm.21 1.68h14.08l-5.88 5.13a1.75 1.75 0 0 1-2.32 0L4.96 7.93Zm-1.21 1.3 4.98 4.35-4.98 3.85V9.23Zm16.5 0v8.2l-4.98-3.85 4.98-4.35Zm-6.42 5.17a3.25 3.25 0 0 1-4.16 0l-.24-.2-4.86 3.76h14.18l-4.86-3.76-.06.05Z" />
    </svg>
  );
}

export function ChatInboxButton() {
  return (
    <button
      type="button"
      onClick={() => toast("Tính năng chat sẽ sớm có mặt.")}
      className="fixed bottom-8 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-dark shadow-card transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-card-hover md:right-8"
      aria-label="Hộp thư chat"
      title="Hộp thư chat"
    >
      <MailOutlineIcon />
      <MailSolidIcon />
    </button>
  );
}
