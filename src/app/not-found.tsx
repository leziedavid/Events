import Link from "next/link";
import { Divider } from "@/components/shared/Ornaments";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="ambient-bg grid min-h-[100svh] place-items-center px-6 text-center">
      <div>
        <p className="font-script text-8xl text-gold-gradient">404</p>
        <h1 className="mt-2 font-display text-4xl font-medium">Cette page s&apos;est égarée</h1>
        <Divider className="mt-5" />
        <p className="mt-5 text-muted-foreground">Le lien que vous avez suivi n&apos;existe pas ou plus.</p>
        <Link href="/" className={buttonVariants({ size: "lg", className: "mt-8" })}>
          Retour à l&apos;invitation
        </Link>
      </div>
    </main>
  );
}
