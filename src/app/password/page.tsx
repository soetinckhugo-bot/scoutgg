import PasswordForm from "./PasswordForm";

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  return <PasswordForm redirect={params.redirect || "/"} />;
}
