export interface DistributedState {
  get<T>(key:string):Promise<T|undefined>;
  set<T>(key:string,value:T,ttlMs?:number):Promise<void>;
  increment(key:string,amount?:number):Promise<number>;
  delete(key:string):Promise<void>;
}
export class MemoryDistributedState implements DistributedState {
  private values=new Map<string,{value:unknown;expiresAt?:number}>();
  async get<T>(key:string){const x=this.values.get(key);if(!x)return undefined;if(x.expiresAt&&x.expiresAt<=Date.now()){this.values.delete(key);return undefined}return x.value as T}
  async set<T>(key:string,value:T,ttlMs?:number){this.values.set(key,{value,expiresAt:ttlMs?Date.now()+ttlMs:undefined})}
  async increment(key:string,amount=1){const n=(await this.get<number>(key)??0)+amount;await this.set(key,n);return n}
  async delete(key:string){this.values.delete(key)}
}
