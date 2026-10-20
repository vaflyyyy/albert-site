import Link from "next/link";
import { content } from "@/content";
import { siteConfig } from "@/config/site";
import { ArrowIcon } from "./icons";
import { PhotoSlot } from "./PhotoSlot";

export function Hero({ image }: { image?: string }) {
  const { hero } = content;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-line">
      {/* Фон: фото, если загружено, иначе атмосферная заглушка */}
      <PhotoSlot src={image} alt="Кофе и латте-арт" priority sizes="100vw" className="!absolute inset-0 -z-10 h-full w-full" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/80 to-night/10" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-transparent to-night/40" />

      <div className="container-page relative flex min-h-[34rem] flex-col justify-center py-20 sm:min-h-[40rem] lg:py-28">
        <p className="eyebrow mb-6">{hero.eyebrow}</p>
        <h1 id="hero-title" className="max-w-2xl text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          {hero.title}
        </h1>
        <p className="mt-7 max-w-md text-lg leading-relaxed text-cream/85">{hero.lead}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/services" className="btn btn-primary">
            Выбрать обучение <ArrowIcon width={16} height={16} />
          </Link>
          <Link href="/contact?service=consultation#booking" className="btn btn-secondary">
            Записаться на консультацию
          </Link>
        </div>
        <dl className="mt-14 flex max-w-md flex-wrap items-stretch gap-x-6 gap-y-4">
          <div>
            <dt className="sr-only">Опыт</dt>
            <dd className="font-display text-3xl">{siteConfig.experienceYears}</dd>
            <p className="text-xs text-mist">года опыта</p>
          </div>
          <div className="hairline-v" aria-hidden="true" />
          <div>
            <dt className="sr-only">Места работы</dt>
            <dd className="font-display text-3xl">{siteConfig.workplaces.length}</dd>
            <p className="text-xs text-mist">заведения</p>
          </div>
          <div className="hairline-v" aria-hidden="true" />
          <div className="self-center">
            <p className="font-display text-xl leading-tight">Профессиональный<br />бариста</p>
          </div>
        </dl>
        <p aria-hidden="true" className="absolute bottom-16 right-8 hidden -rotate-12 font-script text-3xl leading-tight text-cream/45 lg:block">
          Good<br />Coffee<br />Better<br />People
        </p>
      </div>
    </section>
  );
}
