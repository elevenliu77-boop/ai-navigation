/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-assign-module-variable, no-var */

 
import "./globals.css";
import type { Metadata } from "next";
import ThemeProvider from "@/components/providers/theme-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { Toaster } from "@/ui/common/sonner";
import Header from "@/components/header/header";
import Footer from "@/components/footer/index";
import SWRProvider from "@/components/providers/swr-provider";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { Analytics as OtherAnalytics } from "@/components/analytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alphahole.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "alphahole · AI效率与赚钱知识库",
    template: "%s | alphahole",
  },
  description:
    "探索AI工具、自动化工作流、提示词模板和真实应用案例，让AI帮助工作、副业和创业。",
  keywords: ["AI工具", "AI效率", "AI赚钱", "AI工作流", "提示词库", "AI知识库"],
  openGraph: {
    type: "website",
    siteName: "alphahole",
    url: siteUrl,
    title: "alphahole - AI效率与赚钱知识库",
    description:
      "探索AI工具、自动化工作流、提示词模板和真实AI应用案例。",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "alphahole - AI效率与赚钱知识库",
    description:
      "探索AI工具、自动化工作流、提示词模板和真实AI应用案例。",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-background"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </StoreProvider>
        </ThemeProvider>
        <VercelAnalytics />
        <OtherAnalytics googleAnalyticsId="G-9MNGY82H1J" />
      </body>
    </html>
  );
}
