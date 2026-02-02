import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'GSV Calendar',
        short_name: 'GSV',
        description: 'Sistema de gestão de escalas do CBMDF',
        start_url: '/',
        display: 'standalone',
        scope: '/',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
