import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Demande d\'autorisation de tournage',
  robots: { index: false, follow: false },
};

// Page volontairement « blanche » (pas d'en-tête ni de pied de page) : elle est intégrée en iframe dans le site de la ville.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
