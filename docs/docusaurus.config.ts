import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TrainSmart Docs',
  tagline: 'Hypertrophy Training & Monorepo Platform Documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://trainsmart.local',
  baseUrl: '/',

  organizationName: 'Kyunn17',
  projectName: 'trainsmart-tracker',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'id',
    locales: ['id'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@scalar/docusaurus',
      {
        id: 'trainsmart-api',
        label: 'API Reference',
        route: '/api',
        configuration: {
          spec: {
            url: '/swagger.json',
          },
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'TrainSmart Docs',
      logo: {
        alt: 'TrainSmart Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Dokumentasi',
        },
        {
          to: '/api',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'http://127.0.0.1:8000/scalar',
          label: 'Backend Swagger/Scalar',
          position: 'right',
        },
        {
          href: 'https://github.com/Kyunn17/trainsmart-tracker',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Dokumentasi',
          items: [
            {
              label: 'Pengantar Monorepo',
              to: '/docs',
            },
            {
              label: 'Backend Architecture',
              to: '/docs/backend/api',
            },
            {
              label: 'Frontend UI',
              to: '/docs/frontend/components',
            },
          ],
        },
        {
          title: 'Arsitektur',
          items: [
            {
              label: 'Skema Database',
              to: '/docs/backend/database',
            },
            {
              label: 'State Management',
              to: '/docs/frontend/state-mgmt',
            },
          ],
        },
        {
          title: 'Repositori & API',
          items: [
            {
              label: 'Interactive API Docs',
              to: '/api',
            },
            {
              label: 'GitHub Repository',
              href: 'https://github.com/Kyunn17/trainsmart-tracker',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TrainSmart Hypertrophy Platform. Monorepo Built.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
