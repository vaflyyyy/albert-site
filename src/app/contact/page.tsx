import { BookingForm } from "@/components/BookingForm";
import { ContactButtons } from "@/components/ContactButtons";
import { SectionHeading } from "@/components/SectionHeading";
import { WEEKDAY_SHORT_RU, scheduleConfig } from "@/config/site";
import { content } from "@/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Контакты и запись",
  description: "Запишитесь на обучение бариста (латте-арт и каппинг входят в программу) или консультацию к бариста Альберту Ермекову.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const params = await searchParams;
  const service = Array.isArray(params.service) ? params.service[0] : params.service;

  return (
    <div className="container-page py-14 sm:py-20">
      <SectionHeading as="h1" eyebrow="Контакты" title={content.booking.title} lead={content.booking.lead} />
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <section id="booking" aria-label="Форма записи" className="scroll-mt-24">
          <BookingForm defaultService={service} />
        </section>
        <aside aria-label="Контакты и расписание" className="space-y-8">
          <div className="panel p-7">
            <h2 className="text-2xl">Написать напрямую</h2>
            <ContactButtons layout="stack" className="mt-5" />
          </div>
          <div className="panel p-7">
            <h2 className="text-2xl">Расписание</h2>
            <p className="mt-3 text-sm text-mist">
              Приём: {scheduleConfig.workingWeekdays.map((d) => WEEKDAY_SHORT_RU[d]).join(", ")}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {scheduleConfig.timeSlots.map((s) => (
                <li key={s.id} className="rounded-full border border-line px-3 py-1 text-mist">{s.label}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-mist">Точное время подтверждается после связи с Альбертом.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
