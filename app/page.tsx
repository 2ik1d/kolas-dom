import Site from './site';
import {getContent} from '@/lib/server';
export const dynamic='force-dynamic';
export default async function Home(){return <Site initial={await getContent()}/>;}
