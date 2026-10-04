export type MultimodalContent =
  | {type:"text";text:string}
  | {type:"image_url";url:string;detail?:"low"|"high"|"auto"};
export function normalizePrompt(system:string|undefined,prompt:string,images:string[]=[]){
  return {system,content:[
    {type:"text" as const,text:prompt},
    ...images.map(url=>({type:"image_url" as const,url}))
  ]};
}
