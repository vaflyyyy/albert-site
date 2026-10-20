import Link from "next/link";
import type { Service } from "@/content/types";
import { getPrice } from "@/lib/pricing";
import { ArrowIcon, CheckIcon, ClockIcon } from "./icons";
import { PhotoSlot } from "./PhotoSlot";
import { PriceTag } from "./PriceTag";

export function ServiceCard({
  service,
  image,
  gallery = [],
  detailed = false,
}: {
  service: Service;
  image?: string;
  /** Фото-лента под описанием (только в подробной карточке) */
  gallery?: string[];
  detailed?: boolean;
}) {
  const bookHref = `/contact?service=${service.id}#booking`;
  const price = getPrice(service.id);

  if (!detailed) {
    return (
      <article className="group panel flex h-full flex-col transition-colors duration-500 hover:border-caramel/60">
        <div className="overflow-hidden">
          <PhotoSlot
            src={image}
            alt={service.title}
            label={service.title}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw"
            className="aspect-[4/3] transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-2xl leading-snug">{service.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{service.short}</p>
          <div className="mt-5 border-t border-line pt-4">
            <PriceTag price={price} />
            {price.duration ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mist">
                <ClockIcon width={14} height={14} /> {price.duration}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link href={`/services#${service.id}`} className="text-sm text-mist underline-offset-4 transition-colors hover:text-cream hover:underline">
              Подробнее
            </Link>
            <Link href={bookHref} className="btn btn-primary !px-4 !py-2">
              Записаться <ArrowIcon width={16} height={16} />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article id={service.id} className="panel scroll-mt-24 p-7 sm:p-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-3xl leading-tight sm:text-4xl">{service.title}</h2>
          <p className="mt-4 leading-relaxed text-mist">{service.description}</p>
          <dl className="mt-7 space-y-5 text-sm">
            <div>
              <dt className="eyebrow mb-1.5">Стоимость</dt>
              <dd><PriceTag price={price} large /></dd>
            </div>
            {price.duration ? (
              <div>
                <dt className="eyebrow mb-1.5">Длительность</dt>
                <dd className="text-cream/90">{price.duration}</dd>
              </div>
            ) : null}
            <div>
              <dt className="eyebrow mb-1.5">Формат</dt>
              <dd className="text-cream/90">{service.format}</dd>
            </div>
          </dl>
          <Link href={bookHref} className="btn btn-primary mt-8">
            Записаться на эту услугу <ArrowIcon width={18} height={18} />
          </Link>
        </div>
        <div className="space-y-7">
          <div>
            <h3 className="eyebrow mb-4 !font-sans">Что входит</h3>
            <ul className="space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex gap-3 text-cream/90">
                  <CheckIcon width={18} height={18} className="mt-1 shrink-0 text-caramel" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-4 !font-sans">Кому подойдёт</h3>
            <ul className="list-disc space-y-2 pl-5 text-mist marker:text-caramel">
              {service.audience.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {gallery.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {gallery.map((src, i) => (
            <li key={src}>
              <PhotoSlot
                src={src}
                alt={`${service.title}: пример работы ${i + 1}`}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 30vw, 50vw"
                className="aspect-[3/4] border border-line"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
