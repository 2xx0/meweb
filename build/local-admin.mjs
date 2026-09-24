import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';

const kinds=['articles','prompts','projects','research','resources','certificates'];
const slug=z.string().min(1).max(100).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u).refine(s=>! /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(s));
const paragraph=z.object({heading:z.string().max(500).optional(),text:z.string().max(50000).optional(),code:z.string().max(50000).optional(),quote:z.string().max(10000).optional()});
const url=z.string().url().refine(v=>/^https?:\/\//.test(v),'استخدم رابط http أو https');
const schema=z.object({slug,title:z.string().trim().min(1).max(300),description:z.string().max(2000),category:z.string().max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),published:z.boolean(),featured:z.boolean().optional(),tags:z.array(z.string().max(100)).max(30),sample:z.boolean().optional(),minutes:z.number().int().min(1).max(999).optional(),paragraphs:z.array(paragraph).max(200).optional(),prompt:z.string().max(100000).optional(),when:z.string().max(5000).optional(),references:z.array(z.object({title:z.string().max(300),url})).max(50).optional(),technologies:z.array(z.string()).optional(),year:z.number().int().optional(),github:url.optional(),demo:url.optional(),issuer:z.string().optional(),credential:url.optional(),image:z.string().refine(v=>/^\/(?!\/)/.test(v)||/^https?:\/\//.test(v)).optional()});
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
export async function generateIndex(root){
 let source="import type {Entry,Kind} from './schema';\n",n=0;const groups=[];
 for(const kind of kinds){const folder=path.join(root,'content',kind);await fs.mkdir(folder,{recursive:true});const names=[];for(const file of (await fs.readdir(folder)).filter(f=>f.endsWith('.json')).sort()){const name='entry'+n++;source+=`import ${name} from ${JSON.stringify('./'+kind+'/'+file)};\n`;names.push(name)}groups.push(`${kind}:[${names}]`)}
 source+=`export const content:Record<Kind,Entry[]>={${groups.join(',')}};\nexport function entries(kind:Kind){return content[kind].filter(e=>e.published).sort((a,b)=>b.date.localeCompare(a.date))}\nexport const searchIndex=Object.entries(content).flatMap(([kind,items])=>items.filter(i=>i.published).map(i=>({title:i.title,description:i.description,tags:i.tags,url:'/'+kind+'/'+i.slug})));\n`;
 const target=path.join(root,'content/index.ts');if(await fs.readFile(target,'utf8').catch(()=>null)!==source)await fs.writeFile(target,source);
}
export function createContentStore(root){
 let queue=Promise.resolve();
 return {
 async list(){const result=[];for(const kind of ['articles','prompts']){const folder=path.join(root,'content',kind);await fs.mkdir(folder,{recursive:true});for(const filename of (await fs.readdir(folder)).filter(f=>f.endsWith('.json'))){const raw=await fs.readFile(path.join(folder,filename),'utf8');result.push({kind,entry:JSON.parse(raw.replace(/^\uFEFF/,'')),revision:hash(raw)})}}return result.sort((a,b)=>b.entry.date.localeCompare(a.entry.date));},
 save(input){const task=queue.then(async()=>{
 const parsed=z.object({kind:z.enum(['articles','prompts']),entry:schema,revision:z.string().nullable(),originalSlug:slug.nullable()}).safeParse(input);
 if(!parsed.success)throw fail(400,'راجع الحقول المطلوبة والرابط والتاريخ والمراجع.');
 const {kind,entry,revision,originalSlug}=parsed.data;
 if(originalSlug&&originalSlug!==entry.slug)throw fail(400,'لا يمكن تغيير رابط محتوى محفوظ.');
 if(entry.published&&(!entry.description.trim()||!entry.category.trim()||(kind==='prompts'?!entry.prompt?.trim():!entry.paragraphs?.some(b=>b.text?.trim()||b.code?.trim()||b.quote?.trim()))))throw fail(400,'أكمل الوصف والتصنيف والمحتوى قبل النشر.');
 const folder=path.join(root,'content',kind);await fs.mkdir(folder,{recursive:true});const target=path.join(folder,entry.slug+'.json');const old=await fs.readFile(target,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e});
 if(originalSlug){if(old===null||hash(old)!==revision)throw fail(409,'هذا المحتوى تغيّر في نافذة أخرى. أعد تحميل القائمة قبل التعديل.');}else if(old!==null)throw fail(409,'هذا الرابط مستخدم. اختر رابطًا آخر.');
 if(old!==null){const backup=path.join(root,'work','content-backups',kind);await fs.mkdir(backup,{recursive:true});await fs.writeFile(path.join(backup,entry.slug+'-'+Date.now()+'-'+randomBytes(3).toString('hex')+'.json'),old)}
 const raw=JSON.stringify(entry,null,2)+'\n';const temporary=target+'.'+randomBytes(6).toString('hex')+'.tmp';await fs.writeFile(temporary,raw);await fs.rename(temporary,target);await generateIndex(root);
 return {kind,entry,revision:hash(raw)};
 });queue=task.catch(()=>{});return task;}
 };
}
export function localAdminPlugin(){return {name:'local-content-admin',apply:'serve',configureServer(server){
 const store=createContentStore(server.config.root),token=randomBytes(32).toString('hex');
 server.middlewares.use('/api/local-admin',async(req,res,next)=>{
 const json=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(value))};
 const host=req.headers.host||'';const remote=req.socket.remoteAddress;
 if(!/^(localhost|127\.0\.0\.1):5173$/.test(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)){json(403,{error:'لوحة الإدارة متاحة على هذا الجهاز فقط.'});return}
 if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==`http://${host}`)){json(403,{error:'مصدر الطلب غير مسموح.'});return}
 try{
 if(req.method==='GET'){json(200,{items:await store.list(),token});return}
 if(req.method!=='POST'){json(405,{error:'طريقة غير مدعومة.'});return}
 if(req.headers.origin!==`http://${host}`||req.headers['x-admin-token']!==token||!req.headers['content-type']?.startsWith('application/json')){json(403,{error:'انتهت جلسة الإدارة. أعد تحميل الصفحة.'});return}
 let raw='';for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>500000)throw fail(413,'المحتوى أكبر من الحد المسموح.');}
 let body;try{body=JSON.parse(raw)}catch{throw fail(400,'تعذّر قراءة الطلب.')}
 json(200,{saved:await store.save(body)});
 }catch(error){json(error.status||500,{error:error.status?error.message:'تعذّر حفظ المحتوى. جرّب مرة ثانية.'})}
 });
}}}
