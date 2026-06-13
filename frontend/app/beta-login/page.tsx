import { Suspense } from "react";
import { BetaLoginPage } from "@/components/BetaLoginPage";

export default function Page() {
  return (
    <Suspense fallback={<main className="beta-login-page" />}>
      <BetaLoginPage />
    </Suspense>
  );
}
