import {getContent} from '@/lib/server';
export default async function sitemap(){const base='https://kolas-dom-homes.tastytoffee2.chatgpt.site';const c=await getContent();return [{url:base,changeFrequency:'weekly',priority:1},{url:base+'/privacy',priority:.2},...c.projects.map(p=>({url:base+'/projects/'+p.id,changeFrequency:'monthly',priority:.8}))];}
