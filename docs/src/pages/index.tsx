import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home(): ReactNode {
  return (
    <Layout
      title="Gym tracker docs"
      description="Documentation for gym tracker app"
    >
      <main>
        <div className="container" style={{padding: '4rem 0'}}>
          <h1>Gym tracker Documentation</h1>

          <p>
            Dokumentasi aplikasi gym tracker
          </p>

          <Link
            className="button button--primary"
            to="/docs"
          >
            Lihat Gym tracker docs
          </Link>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
  <Link className="button button--primary" to="/docs/backend/api">
    Dokumentasi Backend
  </Link>
  <Link className="button button--secondary" to="/docs/frontend/components">
    Panduan Frontend
  </Link>
  <Link className="button button--outline button--primary" to="/docs/frontend/state-mgmt">
    State & SBL
  </Link>
</div>
        </div>
      </main>
    </Layout>
  );
}