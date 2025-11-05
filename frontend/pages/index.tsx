import Head from 'next/head'
import Layout from '../components/Layout'
import Dashboard from '../components/Dashboard'
import AuthGuard from '../components/AuthGuard'

export default function Home() {
  return (
    <AuthGuard>
      <Layout>
        <Head>
          <title>Dashboard - RFP Proposal System</title>
        </Head>
        <Dashboard />
      </Layout>
    </AuthGuard>
  )
}