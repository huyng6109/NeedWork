"use client";

import Link from "next/link";

function UserOutlineIcon() {
  return (
    <svg
      className="theme-user-outline h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.25 19.2C5.25 15.87 8.2 13.75 12 13.75C15.8 13.75 18.75 15.87 18.75 19.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserSolidIcon() {
  return (
    <svg
      className="theme-user-solid hidden h-6 w-6"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5ZM12 14.25c-4.55 0-8 2.57-8 5.96 0 .86.69 1.54 1.54 1.54h12.92c.85 0 1.54-.68 1.54-1.54 0-3.39-3.45-5.96-8-5.96Z" />
    </svg>
  );
}

export function ProfileQuickButton() {
  return (
    <Link
      href="/account"
      className="fixed bottom-24 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-dark shadow-card transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-card-hover md:right-8"
      aria-label="Trang cá nhân"
      title="Trang cá nhân"
    >
      <UserOutlineIcon />
      <UserSolidIcon />
    </Link>
  );
}
