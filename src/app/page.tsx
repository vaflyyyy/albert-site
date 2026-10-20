import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { ContactButtons } from "@/components/ContactButtons";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { ArrowIcon } from "@/components/icons";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
import { siteConfig } from "@/config/site";
import { content } from "@/content";
import { getSiteImages } from "@/lib/images";

export default function HomePage() {
  const { intro, services } = content;
  const img = getSiteImages();

  return (
    <>
      <Hero image={img.hero} />

      {/* О себе */}
      <section id="about" aria-labelledby="intro-title" className="container-page py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <PhotoSlot src={img.portrait} alt={content.hero.photoAlt} label="Портрет Альберта" sizes="(min-width: 1024px) 35vw, 90vw" className="mx-auto aspect-[4/5] w-full max-w-sm border border-line" />
          </Reveal>
          <div>
            <SectionHeading id="intro-title" eyebrow="Об Альберте" title={intro.title} />
            <Reveal className="mt-6 space-y-5 text-lg leading-relaxed text-mist">
              {intro.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <Link href="/about" className="inline-flex items-center gap-2 pt-2 text-cream underline decoration-caramel underline-offset-8 transition-colors hover:text-caramel-300">
                Узнать больше <ArrowIcon width={16} height={16} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Опыт */}
      <section aria-labelledby="experience-title" className="border-y border-line bg-surface">
        <div className="grid lg:grid-cols-2">
          <PhotoSlot src={img.about} alt="Работа за баром" label="Фото: работа за баром" sizes="(min-width: 1024px) 50vw, 100vw" shade className="min-h-[18rem] lg:min-h-full" />
          <div className="px-5 py-16 sm:px-12 lg:px-16 lg:py-24">
            <SectionHeading
              id="experience-title"
              eyebrow="Опыт работы"
              title={`${siteConfig.experienceYears} года в индустрии специалти кофе`}
              lead="Разные кофейни, оборудование и гости — всё это формирует взгляд на кофе, которым я делюсь на занятиях."
            />
            <div className="mt-10">
              <ExperienceTimeline />
            </div>
          </div>
        </div>
      </section>

      {/* Услуги и цены */}
      <section id="services" aria-labelledby="services-title" className="container-page scroll-mt-20 py-20 sm:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="services-title" eyebrow="Услуги и обучение" title="Развивайте свои кофейные навыки" />
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-cream underline decoration-caramel underline-offset-8">
            Все услуги <ArrowIcon width={16} height={16} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 80} className="h-full">
              <ServiceCard service={s} image={img.services[s.id]} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Портфолио */}
      <section id="portfolio" aria-labelledby="portfolio-title" className="container-page scroll-mt-20 pb-20 sm:pb-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="portfolio-title" eyebrow="Портфолио" title="Кофе в деталях" lead="Процессы, техника, атмосфера и результат." />
          <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-cream underline decoration-caramel underline-offset-8">
            Смотреть галерею <ArrowIcon width={16} height={16} />
          </Link>
        </div>
        <PortfolioGallery images={img.portfolio} limit={4} showFilters={false} />
      </section>

      {/* Открытие кофейни */}
      <section aria-labelledby="bar-title" className="relative isolate overflow-hidden border-y border-line">
        <PhotoSlot src={img.bar} alt="Кофейный бар" sizes="100vw" className="!absolute inset-0 -z-10 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-night/80" />
        <div className="container-page grid items-center gap-8 py-20 sm:py-28 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">Консалтинг</p>
            <h2 id="bar-title" className="mt-4 text-4xl sm:text-5xl">Планируете открыть кофейню?</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/80">{content.barOpening.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/coffee-bar-opening" className="btn btn-light">Как это работает</Link>
            <Link href="/contact?service=bar-opening#booking" className="btn btn-secondary">Запросить расчёт</Link>
          </div>
        </div>
      </section>

      {/* Запись */}
      <section id="booking" aria-labelledby="booking-title" className="container-page scroll-mt-20 py-20 sm:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading id="booking-title" eyebrow="Запись" title={content.booking.title} lead={content.booking.lead} />
          <BookingForm />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="container-page scroll-mt-20 pb-20 sm:pb-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Частые вопросы" />
          <Faq />
        </div>
      </section>

      {/* Контакты */}
      <section id="contacts" aria-labelledby="contacts-title" className="container-page scroll-mt-20">
        <div className="panel grain p-8 text-center sm:p-14">
          <h2 id="contacts-title" className="text-4xl sm:text-5xl">Давайте приготовим что-то хорошее</h2>
          <p className="mx-auto mt-4 max-w-xl text-mist">Напишите напрямую или оставьте заявку — я свяжусь с вами и подтвержу запись.</p>
          <div className="relative z-10 mt-8 flex justify-center">
            <ContactButtons />
          </div>
        </div>
      </section>
    </>
  );
}
