import { Suspense } from "react";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { FullScreenLoader } from "@/components/shared/full-screenloader";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params;
  return (
    <Suspense fallback={<FullScreenLoader label="Loading chat..." />}>
      <ChatView key={id} chatId={id} />
    </Suspense>
  );
};

export default Page;
