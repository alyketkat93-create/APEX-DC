import type { Metadata } from 'next';
import './globals.css';
import { ProjectProvider } from '@/context/ProjectContext';

export const metadata: Metadata = {
  title: 'APEX DC — Enterprise Document Control & Project Management Hub',
  description: 'Production Document Control, Shop Drawings, Technical Submittals, IR, MIR, NCR, and Custom Registers Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}
