import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  id?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <Tag id={id} className="text-4xl leading-[1.1] sm:text-5xl">
        {title}
      </Tag>
      {lead ? <p className="mt-5 text-lg leading-relaxed text-mist">{lead}</p> : null}
    </div>
  );
}
