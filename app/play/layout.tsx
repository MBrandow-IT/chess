import { PlayFooter } from "@/components/play/PlayFooter";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{children}</div>
      <PlayFooter />
    </div>
  );
}
