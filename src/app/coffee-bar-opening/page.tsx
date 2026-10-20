import Link from "next/link";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { content } from "@/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Открытие кофейни под ключ",
  description: "Консалтинг по открытию кофейных баров: концепция, оборудование, меню, обучение команды и запуск.",
  path: "/coffee-bar-opening",
});

export default function CoffeeBarOpeningPage() {
  const { barOpening } = content;
  return (
    <div className="container-page py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Консалтинг" title={barOpening.title} lead={barOpening.lead} />

      <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {barOpening.steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={(i % 3) * 80} className="h-full">
              <div className="h-full panel p-7">
                <span className="font-display text-5xl text-caramel/70" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 text-2xl">
                  <span className="sr-only">Шаг {i + 1}: </span>
                  {step.title}
                </h2>
                <p className="mt-3 leading-relaxed text-mist">{step.text}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-10 md:grid-cols-2">
        <section aria-labelledby="deliver-title" className="panel p-8">
          <h2 id="deliver-title" className="text-3xl">Что вы получите</h2>
          <ul className="mt-5 space-y-3">
            {barOpening.deliverables.map((d) => (
              <li key={d} className="flex gap-3">
                <CheckIcon width={18} height={18} className="mt-1 shrink-0 text-caramel" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="for-title" className="panel p-8">
          <h2 id="for-title" className="text-3xl">Кому подойдёт</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 marker:text-caramel">
            {barOpening.forWhom.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-16 panel grain p-10 text-center">
        <h2 className="text-4xl">Обсудим ваш проект?</h2>
        <p className="mx-auto mt-3 max-w-lg text-mist">Расскажите об идее — подскажу, с чего начать. Сроки и состав работ зависят от проекта и обсуждаются индивидуально.</p>
        <Link href="/contact?service=bar-opening#booking" className="btn btn-primary relative z-10 mt-7">
          Запросить индивидуальный расчёт <ArrowIcon width={18} height={18} />
        </Link>
      </div>
    </div>
  );
}
