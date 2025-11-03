import { ReactNode } from 'react';

// Enable dynamic params for static export
export const dynamicParams = true;

// Required for static export with dynamic routes
export async function generateStaticParams() {
    // For static export, provide a comprehensive list of job IDs
    const fallbackJobIds = [
        { jobId: '1' },
        { jobId: '2' },
        { jobId: '3' },
        { jobId: '4' },
        { jobId: '5' },
        { jobId: '6' },
        { jobId: '7' },
        { jobId: '8' },
        { jobId: '9' },
        { jobId: '10' },
        { jobId: '11' },
        { jobId: '12' },
        { jobId: '13' },
        { jobId: '14' },
        { jobId: '15' },
        { jobId: '16' },
        { jobId: '17' },
        { jobId: '18' },
        { jobId: '19' },
        { jobId: '20' },
    ];

    try {
        // Try to fetch actual job IDs from the database for static generation
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        );

        const { data: jobs } = await supabase
            .from('jobs')
            .select('id')
            .limit(50); // Limit to prevent too many static pages

        if (jobs && jobs.length > 0) {
            const dbJobIds = jobs.map(job => ({ jobId: job.id.toString() }));
            // Merge database IDs with fallback IDs to ensure coverage
            const allJobIds = [...dbJobIds, ...fallbackJobIds];
            // Remove duplicates
            const uniqueJobIds = allJobIds.filter((item, index, arr) =>
                arr.findIndex(i => i.jobId === item.jobId) === index
            );
            return uniqueJobIds;
        }
    } catch (error) {
        console.warn('Could not fetch jobs for static generation, using fallback:', error);
    }

    // Fallback: provide default job IDs for static export
    return fallbackJobIds;
}

interface LayoutProps {
    children: ReactNode;
    params: { jobId: string };
}

export default function JobLayout({ children }: LayoutProps) {
    return <>{children}</>;
}