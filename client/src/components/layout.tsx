import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-grow p-6 md:p-8 bg-gray-50 dark:bg-neutral-900">
          {children}
        </div>
      </main>
    </div>
  );
}
