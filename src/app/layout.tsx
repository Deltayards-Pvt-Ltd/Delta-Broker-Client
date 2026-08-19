import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NavigationProgress from "@/app/component/NavigationProgress";
import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DCP · Channel Partner Platform",
  description: "Delta Yards Channel Partner Platform (DCP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={firaSans.variable}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NavigationProgress />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
