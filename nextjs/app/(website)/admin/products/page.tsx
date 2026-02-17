import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { timeAgo } from "@/lib/format";
import { PRODUCT_STATUS_STYLES } from "@/lib/constants";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { StatusEditor, DeleteButton } from "./actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "products admin",
  description: "manage products",
};

async function ProductsContent() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="py-4">
      <PageBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Products" },
        ]}
      />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Products</h1>
      <p className="text-muted-foreground mb-6">
        Manage product statuses.
      </p>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No products yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        <Link
                          href={`/products/${product.id}`}
                          className="hover:underline"
                        >
                          {product.name}
                        </Link>
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] border-0 ${PRODUCT_STATUS_STYLES[product.status] ?? ""}`}
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Created {timeAgo(product.created_at)}
                      <span className="ml-2 font-mono">{product.id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusEditor
                      productId={product.id}
                      currentStatus={product.status}
                    />
                    <DeleteButton productId={product.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
