import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.TEST_SITE_URL||'http://127.0.0.1:5173';
const access=readFileSync('OWNER-ACCESS.private.txt','utf8');
const username=access.match(/^Логин: (.+)$/m)[1].trim(),password=access.match(/^Пароль: (.+)$/m)[1].trim();
let cookie='';
const request=async(path,method='GET',body,auth=false,extra={})=>{const r=await fetch(base+path,{method,redirect:'manual',headers:{...(body?{'Content-Type':'application/json'}:{}),...(auth&&cookie?{Cookie:cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data={text:raw};}return{status:r.status,data,headers:r.headers};};
assert.equal((await request('/api/admin')).status,401);
assert.equal((await request('/api/admin','POST',{content:{}},false)).status,403);
assert.equal((await request('/api/auth','POST',{username,password:'wrong-password'})).status,401);
assert.equal((await request('/api/auth','POST',{username,password},false,{Origin:'https://untrusted.example'})).status,403);
let r=await request('/api/auth','POST',{username,password});assert.equal(r.status,200);
const setCookie=r.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Lax/);if(base.startsWith('https:'))assert.match(setCookie,/Secure/);cookie=setCookie.split(';')[0];
assert.equal((await request('/api/admin','GET',undefined,true)).status,200,'session must authenticate subsequent requests');
assert.equal((await request('/api/admin','GET',undefined,false,{Authorization:'Bearer invalid'})).status,401,'old bearer access must no longer work');
assert.equal((await request('/api/leads','POST',{name:'X',phone:'123',consent:false})).status,400);
let leadId;const original=(await request('/api/content')).data;
try{
 r=await request('/api/leads','POST',{name:'Проверка нового входа',phone:'+7 (000) 000-00-00',comment:'Синтетическая тестовая заявка. Не звонить.',consent:true,source:'auth-qa'});assert.equal(r.status,200);leadId=r.data.id;
 const admin=await request('/api/admin','GET',undefined,true);assert.ok(admin.data.leads.some(l=>l.id===leadId));
 assert.equal((await request('/api/admin','POST',{leadId,status:'contacted'},true)).status,200);
 assert.equal((await request('/api/admin','POST',{content:{...original,projects:[{...original.projects[0],image:'javascript:alert(1)'}]}},true)).status,400);
 assert.equal((await request('/api/admin','POST',{content:original},true)).status,200,'saving content through cookie session must work');
}finally{if(leadId)assert.equal((await request('/api/admin','DELETE',{leadId},true)).status,200);}
assert.equal((await request('/api/auth','DELETE',undefined,true)).status,200);
assert.equal((await request('/api/admin','GET',undefined,true)).status,401,'logout must revoke session on the server');
assert.equal((await request('/api/admin','GET',undefined,false,{Cookie:'kolas_session='+'f'.repeat(64)})).status,401,'forged session rejected');
for(const path of ['/','/projects/lesnoy','/admin','/privacy','/robots.txt','/sitemap.xml','/images/hero.webp']){const page=await fetch(base+path,{redirect:'manual'});assert.equal(page.status,200,path);if(path==='/'||path==='/admin'){const html=await page.text();assert.ok(!html.includes('ADMIN_TOKEN'));assert.ok(!html.includes('Ключ администратора'));}}
console.log('PASS: username/password login, session persistence, logout revocation, invalid password/cookie/origin rejection, protected admin APIs, lead storage/deletion and anonymous pages.');
