import {content} from '@/content';
export default function sitemap(){const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:5173';return ['','/about',...Object.keys(content).map(s=>'/'+s),...Object.entries(content).flatMap(([s,items])=>items.filter(i=>i.published).map(i=>'/'+s+'/'+i.slug))].map(path=>({url:base+path}))}
