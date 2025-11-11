import { Helmet } from 'react-helmet-async';

export const DocumentHead = () => {
  return (
    <Helmet>
      <title>AegisOS - Modern Business Management System</title>
      <meta name="description" content="AegisOS - A comprehensive business management solution" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#ffffff" />
    </Helmet>
  );
};

export default DocumentHead;
