import {env} from 'cloudflare:workers';
import {defaults,Content} from './content';
export function db(){if(!env.DB)throw new Error('Хранилище временно недоступно');return env.DB;}
export async function getContent():Promise<Content>{try{const r=await db().prepare('SELECT json FROM content WHERE id = ?').bind('site').first<{json:string}>();return r?{...defaults,...JSON.parse(r.json)}:defaults;}catch{return defaults;}}
export const authConfig=()=>env as unknown as {ADMIN_USERNAME?:string;ADMIN_PASSWORD_HASH?:string};
export async function sha256(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
export function sessionToken(request:Request){const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('kolas_session='))?.slice('kolas_session='.length);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
export async function admin(request:Request){const token=sessionToken(request),config=authConfig();if(!token||!config.ADMIN_PASSWORD_HASH)return false;try{const session=await db().prepare('SELECT credential_version FROM admin_sessions WHERE token_hash = ? AND expires_at > ?').bind(await sha256(token),Date.now()).first<{credential_version:string}>();return !!session&&session.credential_version===await sha256(config.ADMIN_PASSWORD_HASH);}catch{return false;}}
export function sessionCookie(request:Request,token:string,maxAge:number){return `kolas_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');return !origin||origin===new URL(r.url).origin;}
export const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
