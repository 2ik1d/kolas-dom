import {admin,db,getContent,response,sameOrigin} from '@/lib/server';
import {z} from 'zod';
const asset=z.string().max(2000).refine(v=>/^https:\/\//.test(v)||/^\/images\/[a-zA-Z0-9._-]+$/.test(v));
const optionalAsset=z.union([z.literal(''),asset]);
const contentSchema=z.object({phone:z.string().max(40),email:z.union([z.literal(''),z.string().email()]),vk:optionalAsset,telegram:optionalAsset,metrika:z.union([z.literal(''),z.string().regex(/^\d{5,12}$/)]),legalName:z.string().max(300),legalDetails:z.string().max(2000),hero:asset,warmRate:z.number().min(1000).max(1000000),turnkeyRate:z.number().min(1000).max(1000000),projects:z.array(z.object({id:z.string().regex(/^[a-z0-9-]+$/).max(80),name:z.string().min(1).max(100),tag:z.string().max(250),area:z.number().positive().max(2000),rooms:z.number().int().min(1).max(50),floors:z.union([z.literal(1),z.literal(2)]),price:z.number().positive().max(1e10),image:asset,description:z.string().max(5000)})).max(50),works:z.array(z.object({title:z.string().min(1).max(200),caption:z.string().max(2000),image:asset,stage:z.enum(['before','process','after'])})).max(80),reviews:z.array(z.object({name:z.string().min(1).max(100),text:z.string().min(1).max(5000),image:optionalAsset,video:optionalAsset})).max(50)});
export async function GET(r:Request){
 if(!await admin(r))return response({error:'Войдите в админ-панель'},401);
 try{await db().prepare('DELETE FROM leads WHERE created_at < ?').bind(Date.now()-365*86400000).run();return response({content:await getContent(),leads:(await db().prepare('SELECT id,name,phone,comment,source,estimate,created_at,status FROM leads ORDER BY created_at DESC LIMIT 500').all()).results});}catch{return response({error:'Хранилище недоступно'},503);}
}
export async function DELETE(r:Request){
 if(!sameOrigin(r)||!await admin(r))return response({error:'Нет доступа'},403);
 try{const b=await r.json() as {leadId:string};if(!b.leadId)return response({error:'Не указан номер заявки'},400);await db().prepare('DELETE FROM leads WHERE id = ?').bind(b.leadId).run();return response({ok:true});}catch{return response({error:'Не удалось удалить заявку'},400);}
}
export async function POST(r:Request){
 if(!sameOrigin(r)||!await admin(r))return response({error:'Нет доступа'},403);
 try{const raw=await r.text();if(raw.length>180000)return response({error:'Данные слишком большие'},413);const body=JSON.parse(raw);
 if(body.leadId&&['new','contacted','done'].includes(body.status)){await db().prepare('UPDATE leads SET status = ? WHERE id = ?').bind(body.status,body.leadId).run();return response({ok:true});}
 const parsed=contentSchema.safeParse(body.content);if(!parsed.success)return response({error:'Проверьте заполнение полей: '+parsed.error.issues.map(i=>i.path.join('.')).slice(0,4).join(', ')},400);
 const c=parsed.data;if(new Set(c.projects.map(p=>p.id)).size!==c.projects.length)return response({error:'Коды проектов должны быть уникальными'},400);
 await db().prepare('INSERT INTO content (id,json) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').bind('site',JSON.stringify(c)).run();return response({ok:true});
 }catch{return response({error:'Не удалось сохранить. Проверьте данные.'},400);}
}
