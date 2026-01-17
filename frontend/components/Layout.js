// components/Layout.js
import Head from 'next/head';

export default function Layout({ children, title = 'TinyAssets' }) {
  return (
    <>
      <Head>
        <title>{title} - Learn Real-World Assets Safely</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="layout">
        {children}
      </div>
      
      <style jsx>{`
        .layout {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </>
  );
}