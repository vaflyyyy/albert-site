import { PortfolioGallery } from "@/components/PortfolioGallery";
import { SectionHeading } from "@/components/SectionHeading";
import { getSiteImages } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Портфолио",
  description: "Галерея: эспрессо, латте-арт, каппинг и кофейные бары.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Портфолио" title="Кофе в кадре" lead="Эспрессо, латте-арт, каппинг и кофейные бары. Нажмите на фото, чтобы открыть его крупнее." />
      <div className="mt-12">
        <PortfolioGallery images={getSiteImages().portfolio} />
      </div>
    </div>
  );
}
