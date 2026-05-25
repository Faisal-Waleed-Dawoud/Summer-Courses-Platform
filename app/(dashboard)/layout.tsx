import type { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import LinksWithUserRole from "@/components/dashboard/LinksWithUserRole";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: {
        template: "Dashboard | %s",
        default: "Dashboard"
    },
 description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
  openGraph: {
    title: "SCP",
    description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
    siteName: "SCP",
    images: [
      {
        url: "https://i.ibb.co/LDk6zT2T/scp-icon.png",
        width: 1024,
        height: 798,
        alt: "SCP Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCP",
    description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
    images: ["https://i.ibb.co/LDk6zT2T/scp-icon.png"],
  },
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    
    return (
        <div className="flex min-h-screen">
            <Suspense fallback={<Skeleton className="min-h-screen w-[350px]"></Skeleton>}>
                <LinksWithUserRole />
            </Suspense>
            <Suspense fallback={<Skeleton className="w-full h-10"></Skeleton>}>
                <div className="grow p-3">
                    <DashboardHeader></DashboardHeader>
                    {children}
                    <Toaster position="bottom-right" expand={true} richColors={true}></Toaster>
                </div>
            </Suspense>
        </div>
    );
}
