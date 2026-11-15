import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="divide-y divide-border rounded-3xl border border-border bg-card px-4 sm:px-6">
      {items.map((item) => (
        <AccordionItem key={item.q} value={item.q} className="border-none">
          <AccordionTrigger className="py-4 text-base font-medium hover:no-underline">{item.q}</AccordionTrigger>
          <AccordionContent className="text-base leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
