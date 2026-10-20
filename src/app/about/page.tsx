import Link from "next/link";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SectionHeading } from "@/components/SectionHeading";
import { content } from "@/content";
import { getSiteImages } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Обо мне",
  description: "Альберт Ермеков — бариста с 4-летним опытом работы в INvictus, «Кофе Бум», «Мастер Кофе» и «Дискавери».",
  path: "/about",
});

export default function AboutPage() {
  const { about } = content;
  const img = getSiteImages();
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <PhotoSlot src={img.portrait} alt="Портрет Альберта Ермекова" label="Портрет Альберта" className="aspect-[4/5] border border-line" priority />
        <div>
          <SectionHeading as="h1" eyebrow="Обо мне" title={about.title} lead={about.lead} />
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-mist">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="principles-title" className="mt-20">
        <h2 id="principles-title" className="text-3xl sm:text-4xl">Мой подход</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {about.principles.map((p) => (
            <li key={p.title} className="panel p-7">
              <h3 className="text-3xl">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-mist">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="exp-title" className="mt-20 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading id="exp-title" eyebrow="Опыт" title="Где я работал" />
        <ExperienceTimeline />
      </section>

      <div className="mt-20 text-center">
        <Link href="/contact#booking" className="btn btn-primary">Записаться на консультацию</Link>
      </div>
    </div>
  );
}
