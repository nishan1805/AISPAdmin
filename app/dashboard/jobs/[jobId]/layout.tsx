import { ReactNode } from 'react';

// Enable dynamic params for static export
export const dynamicParams = true;

// Required for static export with dynamic routes
export async function generateStaticParams() {
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
            return jobs.map(job => ({ jobId: job.id.toString() }));
        }
    } catch (error) {
        console.warn('Could not fetch jobs for static generation:', error);
    }

    // Fallback: provide some default job IDs for static export
    return [
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
    ];
}

interface LayoutProps {
    children: ReactNode;
    params: { jobId: string };
}

export default function JobLayout({ children }: LayoutProps) {
    return <>{children}</>;
}