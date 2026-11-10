import {authConfig,db,response,sameOrigin,sessionCookie,sessionToken,sha256} from '@/lib/server';

async function verifyPassword(password:string,stored:string){
 const [algorithm,iterations,salt,expected]=stored.split('$');
 if(algorithm!=='pbkdf2-sha256'||iterations!=='100000'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(expected))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const saltBytes=Uint8Array.from(salt.match(/../g)!,s=>parseInt(s,16));
 const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBytes,iterations:100000},key,256));
 const wanted=Uint8Array.from(expected.match(/../g)!,s=>parseInt(s,16));
 return actual.reduce((result,n,i)=>result|(n^wanted[i]),0)===0;
}

export async function POST(request:Request){
 if(!sameOrigin(request)||!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'Недопустимый запрос'},403);
 const config=authConfig();if(!config.ADMIN_USERNAME||!config.ADMIN_PASSWORD_HASH)return response({error:'Вход временно недоступен'},503);
 try{
  const raw=await request.text();if(raw.length>3000)return response({error:'Недопустимый запрос'},400);
  const body=JSON.parse(raw);if(typeof body.username!=='string'||typeof body.password!=='string'||body.username.length>100||body.password.length>200)return response({error:'Введите логин и пароль'},400);
  const ipHash=await sha256(request.headers.get('cf-connecting-ip')||'local'),now=Date.now();
  const attempt=await db().prepare('SELECT failures,window_start,locked_until FROM login_attempts WHERE ip_hash = ?').bind(ipHash).first<{failures:number;window_start:number;locked_until:number}>();
  if(attempt&&attempt.locked_until>now)return response({error:'Слишком много попыток. Попробуйте через 15 минут.'},429);
  const validPassword=await verifyPassword(body.password,config.ADMIN_PASSWORD_HASH);
  if(body.username!==config.ADMIN_USERNAME||!validPassword){
   const failures=attempt&&attempt.window_start>now-900000?attempt.failures+1:1;
   await db().prepare('INSERT INTO login_attempts (ip_hash,failures,window_start,locked_until) VALUES (?,?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET failures=excluded.failures,window_start=excluded.window_start,locked_until=excluded.locked_until').bind(ipHash,failures,attempt&&attempt.window_start>now-900000?attempt.window_start:now,failures>=5?now+900000:0).run();
   return response({error:'Неверный логин или пароль'},401);
  }
  await db().prepare('DELETE FROM login_attempts WHERE ip_hash = ? OR window_start < ?').bind(ipHash,now-86400000).run();
  await db().prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join('');
  await db().prepare('INSERT INTO admin_sessions (token_hash,credential_version,expires_at) VALUES (?,?,?)').bind(await sha256(token),await sha256(config.ADMIN_PASSWORD_HASH),now+43200000).run();
  const result=response({ok:true});result.headers.set('Set-Cookie',sessionCookie(request,token,43200));return result;
 }catch{return response({error:'Не удалось войти. Попробуйте ещё раз.'},503);}
}

export async function DELETE(request:Request){
 if(!sameOrigin(request))return response({error:'Недопустимый запрос'},403);
 try{const token=sessionToken(request);if(token)await db().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(token)).run();const result=response({ok:true});result.headers.set('Set-Cookie',sessionCookie(request,'',0));return result;}catch{return response({error:'Не удалось выйти. Попробуйте ещё раз.'},503);}
}
