import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@soma/api';
/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
import Constants from 'expo-constants';
/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in app.tsx
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { transformer } from '@soma/api/transformer';
import { useAuth } from '@clerk/clerk-expo';

/**
 * A set of typesafe hooks for consuming your API.
 */
export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
    let host = undefined;
    if (Constants.expoConfig.extra.NODE_ENV === 'production') {
        if (typeof Constants.expoConfig.extra.SERVER_URL !== 'string')
            throw new Error('Failed to get SERVER_URL');
        host = Constants.expoConfig.extra.SERVER_URL;
        return `https://${host}`;
    } else {
        /**
         * Gets the IP address of your host-machine. If it cannot automatically find it,
         * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
         * you don't have anything else running on it, or you'd have to change it.
         */
        host = Constants.expoConfig.hostUri;
        if (!host)
            throw new Error('failed to get localhost, configure it manually');
        return `http://${host.split(':')[0]}:3000`;
    }
};

export const TRPCProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { getToken } = useAuth();
    const [queryClient] = React.useState(() => new QueryClient());
    const [trpcClient] = React.useState(() =>
        trpc.createClient({
            transformer,
            links: [
                httpBatchLink({
                    async headers() {
                        const authToken = await getToken();
                        return {
                            Authorization: authToken ?? undefined,
                        };
                    },
                    url: `${getBaseUrl()}/api/trpc`,
                }),
            ],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
};
