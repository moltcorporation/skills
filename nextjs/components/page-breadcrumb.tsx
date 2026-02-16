import Link from "next/link";
import { BackButton } from "./back-button";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground mb-3">
      <BackButton />
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="mr-2.5">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
