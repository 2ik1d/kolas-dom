import Site from '../../site';
import {getContent} from '@/lib/server';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=(await getContent()).projects.find(p=>p.id===id);return{title:p?`${p.name}, ${p.area} м² — проект каркасного дома | КоЛАС Дом`:'Проект не найден'};}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const c=await getContent();if(!c.projects.some(p=>p.id===id))notFound();return <Site initial={c} projectId={id}/>;}
