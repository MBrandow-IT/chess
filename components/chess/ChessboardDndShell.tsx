"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ChessboardDnDProvider = dynamic(
  () => import("react-chessboard").then((m) => m.ChessboardDnDProvider),
  { ssr: false },
);

/**
 * react-chessboard mounts one react-dnd HTML5 backend per page unless a single
 * ChessboardDnDProvider wraps every Chessboard on that page. Use this around
 * any view that renders more than one board (e.g. the puzzle editor).
 */
export function ChessboardDndShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ChessboardDnDProvider>
      <div className={className}>{children}</div>
    </ChessboardDnDProvider>
  );
}
