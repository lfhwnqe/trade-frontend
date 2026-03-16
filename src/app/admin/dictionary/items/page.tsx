import { Suspense } from "react";
import DictionaryItemsPageClient from "./DictionaryItemsPageClient";

export const dynamic = "force-dynamic";

export default function DictionaryItemsPage() {
  return (
    <Suspense fallback={null}>
      <DictionaryItemsPageClient />
    </Suspense>
  );
}
