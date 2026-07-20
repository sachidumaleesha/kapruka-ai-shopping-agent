import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { FullScreenLoader } from "@/components/shared/full-screenloader";

interface PageProps {
  params: Promise<{ id: string }>;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Page = async ({ params }: PageProps) => {
  const { id } = await params;

  if (!uuidRegex.test(id)) {
    redirect("/");
  }

  return (
    <Suspense fallback={<FullScreenLoader label="Loading chat..." />}>
      <ChatView key={id} chatId={id} />
    </Suspense>
  );
};

export default Page;
