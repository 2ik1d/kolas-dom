import {getContent,response} from '@/lib/server';
export async function GET(){return response(await getContent());}
