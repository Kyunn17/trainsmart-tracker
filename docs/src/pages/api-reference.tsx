import React from 'react';
import Layout from '@theme/Layout';
import { ApiReferenceReact } from '@scalar/api-reference-react';

export default function ApiReferencePage() {
  return (
    <Layout
      title="API Reference"
      description="API Reference menggunakan Scalar"
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        <ApiReferenceReact
  configuration={{
    url: 'http://127.0.0.1:8000/scalar#description/introduction',
    hideClientButton: true,
    hideModels: true,
    hideDownloadButton: true,
    hideTestRequestButton: true,
  }}
/>

      </div>
    </Layout>
  );
}