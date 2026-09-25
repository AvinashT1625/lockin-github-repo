import './globals.css';

export const metadata = {
  title: 'Focus Timer',
  description: 'A premium floating countdown timer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
