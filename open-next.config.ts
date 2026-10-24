import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Сайт не использует revalidate и "use cache": предрендеренные страницы отдаются из статических
// ассетов воркера, без R2/KV. enableCacheInterception не включаем — несовместим с PPR.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
