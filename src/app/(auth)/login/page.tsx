import { AuthForm } from "./AuthForm";

interface LoginPageProps {
  searchParams?: {
    mode?: string;
    redirect?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo =
    searchParams?.redirect && /^\/(?!\/)/.test(searchParams.redirect)
      ? searchParams.redirect
      : "/";
  const initialMode = searchParams?.mode === "register" ? "register" : "login";

  return <AuthForm initialMode={initialMode} redirectTo={redirectTo} />;
}
