/**
 * Child-friendly glossary of chess terms. Add new entries here and reference
 * them in MDX via `<Term name="fork">fork</Term>`.
 */
export type GlossaryEntry = {
  title: string;
  description: string;
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  fork: {
    title: "Fork",
    description:
      "One piece attacks two (or more) of your opponent's pieces at the same time. Knights are great at forks!",
  },
  pin: {
    title: "Pin",
    description:
      "A piece is stuck — if it moves, a more valuable piece behind it gets captured.",
  },
  skewer: {
    title: "Skewer",
    description:
      "Like a pin in reverse: a big piece is attacked, and a smaller piece is behind it. When the big piece moves, you take the smaller one.",
  },
  check: {
    title: "Check",
    description:
      "The king is being attacked. You must do something about it on your next move.",
  },
  checkmate: {
    title: "Checkmate",
    description:
      "The king is being attacked and there is no way to stop it. The game is over.",
  },
  stalemate: {
    title: "Stalemate",
    description:
      "It's your turn, you have no legal moves, but you are NOT in check. The game is a draw (tie).",
  },
  castling: {
    title: "Castling",
    description:
      "A special move where your king and rook move at the same time. It helps keep the king safe.",
  },
  enpassant: {
    title: "En passant",
    description:
      "A special pawn capture. If a pawn moves two squares forward and lands right next to your pawn, your pawn can capture it as if it had moved only one square.",
  },
  promotion: {
    title: "Promotion",
    description:
      "When a pawn reaches the far end of the board, it transforms into a queen, rook, bishop, or knight.",
  },
  development: {
    title: "Development",
    description:
      "Bringing your pieces (knights and bishops first!) off the back rank so they can do useful things.",
  },
  fen: {
    title: "FEN",
    description:
      "A short text string that describes exactly where every piece is on the board.",
  },
  san: {
    title: "SAN (Notation)",
    description:
      "A short way to write a chess move. 'Nf3' means 'knight to f3'. 'O-O' means castle short.",
  },
};
