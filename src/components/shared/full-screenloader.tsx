import { Spinner } from "../ui/spinner";

interface FullScreenLoaderProps {
  label?: string;
}

export const FullScreenLoader = ({ label }: FullScreenLoaderProps) => {
  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex flex-col items-center justify-center gap-2"
    >
      <Spinner />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};