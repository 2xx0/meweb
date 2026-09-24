import type {Entry,Kind} from './schema';
import entry0 from "./articles/docker.json";
import entry1 from "./articles/how-git-works.json";
import entry2 from "./articles/javascript.json";
import entry3 from "./prompts/code-review.json";
import entry4 from "./prompts/understand-code.json";
import entry5 from "./resources/github.json";
export const content:Record<Kind,Entry[]>={articles:[entry0,entry1,entry2],prompts:[entry3,entry4],projects:[],research:[],resources:[entry5],certificates:[]};
export function entries(kind:Kind){return content[kind].filter(e=>e.published).sort((a,b)=>b.date.localeCompare(a.date))}
export const searchIndex=Object.entries(content).flatMap(([kind,items])=>items.filter(i=>i.published).map(i=>({title:i.title,description:i.description,tags:i.tags,url:'/'+kind+'/'+i.slug})));
