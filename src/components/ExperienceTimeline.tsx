import { content } from "@/content";
import { Reveal } from "./Reveal";

export function ExperienceTimeline() {
  return (
    <ol className="relative ml-2 space-y-8 border-l border-line pl-8">
      {content.experience.map((item, i) => (
        <li key={item.name} className="relative">
          <span aria-hidden="true" className="absolute -left-[2.45rem] top-2.5 h-2.5 w-2.5 rounded-full bg-caramel ring-4 ring-night" />
          <Reveal delay={i * 80}>
            <h3 className="text-3xl leading-tight">{item.name}</h3>
            {item.role || item.period ? <p className="mt-1 text-sm text-caramel-300">{[item.role, item.period].filter(Boolean).join(" · ")}</p> : null}
            {item.highlights?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-mist marker:text-caramel">
                {item.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
