import Head from 'next/head'
import Layout from '../components/Layout'
import Dashboard from '../components/Dashboard'

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Dashboard - RFP Proposal System</title>
      </Head>
      <Dashboard />
    </Layout>
  )
}