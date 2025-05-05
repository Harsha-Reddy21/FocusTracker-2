import { Layout } from "@/components/layout";
import { BlockListManager } from "@/components/block-list-manager";

export default function BlocklistPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Distraction Blocklist</h2>
          <p className="text-muted-foreground">Manage websites you want to block during focus sessions</p>
        </div>

        <BlockListManager />
      </div>
    </Layout>
  );
}
