import { ServiceCard } from "@/components/ServiceCard";
import { SectionHeading } from "@/components/SectionHeading";
import { content } from "@/content";
import { getSiteImages } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Услуги и цены",
  description: "Обучение бариста (латте-арт и каппинг входят в программу), открытие кофейных баров под ключ и индивидуальные консультации. Стоимость в тенге (₸).",
  path: "/services",
});

export default function ServicesPage() {
  const img = getSiteImages();
  return (
    <div className="container-page py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Услуги" title="Обучение и консалтинг по кофе" lead="Выберите направление и запишитесь — формат и детали мы обсудим лично. Стоимость указана в тенге (₸)." />
      <div className="mt-12 space-y-6">
        {content.services.map((s) => (
          <ServiceCard key={s.id} service={s} gallery={img.serviceGallery[s.id]} detailed />
        ))}
      </div>
    </div>
  );
}
