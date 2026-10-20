import { content } from "@/content";

/** Нативные <details>: работает без JS, доступно с клавиатуры. */
export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {content.faq.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl leading-snug marker:hidden [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden="true" className="text-caramel transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-2xl leading-relaxed text-mist">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
