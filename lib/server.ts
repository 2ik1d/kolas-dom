import {env} from 'cloudflare:workers';
import {defaults,Content} from './content';
export function db(){if(!env.DB)throw new Error('Хранилище временно недоступно');return env.DB;}
export async function getContent():Promise<Content>{try{const r=await db().prepare('SELECT json FROM content WHERE id = ?').bind('site').first<{json:string}>();return r?{...defaults,...JSON.parse(r.json)}:defaults;}catch{return defaults;}}
export async function admin(request:Request){const key=(env as unknown as Record<string,string>).ADMIN_TOKEN;const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!key||!token)return false;const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [a,b]=await Promise.all([hash(key),hash(token)]);return a.reduce((v,n,i)=>v|(n^b[i]),0)===0;}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');return !origin||origin===new URL(r.url).origin;}
export const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
