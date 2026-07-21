import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FullScreenLoader } from "@/components/shared/full-screenloader";
import { isValidChatId } from "@/lib/chat-id";
import { ChatView } from "@/modules/chat/ui/views/chat-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProps) => {
  const [{ id }, t] = await Promise.all([params, getTranslations("Chat")]);

  if (!isValidChatId(id)) {
    redirect("/");
  }

  return (
    <Suspense fallback={<FullScreenLoader label={t("loading")} />}>
      <ChatView chatId={id} />
    </Suspense>
  );
};

export default Page;
