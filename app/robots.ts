export default function robots(){const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:5173';return {rules:{userAgent:'*',allow:'/',disallow:'/admin'},sitemap:`${base}/sitemap.xml`}}
