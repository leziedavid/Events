import { HomeContent } from "@/components/home/HomeContent";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <HomeContent />
      <SiteFooter />
    </>
  );
}
