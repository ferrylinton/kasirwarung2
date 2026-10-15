import { MongoClient, Db, ObjectId } from 'mongodb';
import { env } from './env.ts';

let mongoClient: MongoClient | null = null;
let nativeDb: Db | null = null;
let isNativeConnected = false;

// In-memory document store fallback with native MongoDB-compatible API
const memoryCollections = new Map<string, any[]>();

function matchesFilter(doc: any, filter: Record<string, any> = {}): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      if (!v.some((subFilter) => matchesFilter(doc, subFilter))) return false;
      continue;
    }
    if (v && typeof v === 'object' && !(v instanceof ObjectId) && !(v instanceof Date)) {
      if ('$regex' in v) {
        const regex = new RegExp(v.$regex, v.$options || '');
        if (!regex.test(String(doc[k] || ''))) return false;
        continue;
      }
      if ('$in' in v && Array.isArray(v.$in)) {
        if (!v.$in.map(String).includes(String(doc[k]))) return false;
        continue;
      }
      if ('$ne' in v) {
        if (String(doc[k] || '') === String(v.$ne || '')) return false;
        continue;
      }
    }
    if (k === '_id' || k.endsWith('Id') || v instanceof ObjectId || doc[k] instanceof ObjectId) {
      if (String(doc[k] || '') !== String(v || '')) return false;
    } else if (doc[k] !== v) {
      return false;
    }
  }
  return true;
}

export function toObjectId(id: string | ObjectId): ObjectId {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
    return new ObjectId(id);
  }
  return new ObjectId();
}

class FallbackCollection<T extends Record<string, any>> {
  private name: string;

  constructor(name: string) {
    this.name = name;
    if (!memoryCollections.has(name)) {
      memoryCollections.set(name, []);
    }
  }

  private getStore(): any[] {
    return memoryCollections.get(this.name)!;
  }

  find(filter: Record<string, any> = {}) {
    let results = this.getStore().filter((d) => matchesFilter(d, filter));
    const chain = {
      sort: (sortSpec: Record<string, 1 | -1>) => {
        const entries = Object.entries(sortSpec);
        results = [...results].sort((a, b) => {
          for (const [key, dir] of entries) {
            if (a[key] < b[key]) return -1 * dir;
            if (a[key] > b[key]) return 1 * dir;
          }
          return 0;
        });
        return chain;
      },
      limit: (n: number) => {
        results = results.slice(0, n);
        return chain;
      },
      toArray: async (): Promise<T[]> => {
        return results.map((item) => ({ ...item }));
      },
    };
    return chain;
  }

  async findOne(filter: Record<string, any> = {}): Promise<T | null> {
    const found = this.getStore().find((d) => matchesFilter(d, filter));
    return found ? { ...found } : null;
  }

  async insertOne(doc: Partial<T>): Promise<{ insertedId: ObjectId }> {
    const _id = doc._id ? new ObjectId(String(doc._id)) : new ObjectId();
    const record = { ...doc, _id };
    this.getStore().push(record);
    return { insertedId: _id };
  }

  async insertMany(docs: Partial<T>[]): Promise<{ insertedCount: number }> {
    for (const d of docs) {
      await this.insertOne(d);
    }
    return { insertedCount: docs.length };
  }

  async updateOne(
    filter: Record<string, any>,
    update: { $set?: Partial<T>; $inc?: Record<string, number> },
    options?: { upsert?: boolean }
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const store = this.getStore();
    const idx = store.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) {
      if (options?.upsert) {
        const newDoc: any = { ...filter, ...(update.$set || {}) };
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            newDoc[k] = (newDoc[k] || 0) + v;
          }
        }
        await this.insertOne(newDoc);
        return { matchedCount: 1, modifiedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const target = { ...store[idx] };
    if (update.$set) {
      Object.assign(target, update.$set);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        target[k] = (Number(target[k]) || 0) + v;
      }
    }
    store[idx] = target;
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter: Record<string, any>): Promise<{ deletedCount: number }> {
    const store = this.getStore();
    const idx = store.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    store.splice(idx, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(filter: Record<string, any> = {}): Promise<{ deletedCount: number }> {
    const store = this.getStore();
    const initialLen = store.length;
    const remaining = store.filter((d) => !matchesFilter(d, filter));
    memoryCollections.set(this.name, remaining);
    return { deletedCount: initialLen - remaining.length };
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    return this.getStore().filter((d) => matchesFilter(d, filter)).length;
  }
}

export async function connectMongoDB(): Promise<void> {
  if (isNativeConnected && nativeDb) return;
  if (!env.MONGODB_URI) {
    console.log('[MongoDB] Running in-memory document engine');
    return;
  }
  try {
    mongoClient = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await mongoClient.connect();
    nativeDb = mongoClient.db();
    await nativeDb.command({ ping: 1 });
    isNativeConnected = true;
    console.log('[MongoDB] Connected to native MongoDB Atlas:', nativeDb.databaseName);
  } catch (err: any) {
    isNativeConnected = false;
    console.warn('[MongoDB] Native connection warning (using compatible collection engine):', err.message);
  }
}

export function getCollection<T extends Record<string, any> = any>(name: string) {
  if (isNativeConnected && nativeDb) {
    return nativeDb.collection<T>(name);
  }
  return new FallbackCollection<T>(name) as unknown as ReturnType<Db['collection']>;
}

export function isMongoNativeConnected(): boolean {
  return isNativeConnected;
}

export { ObjectId };
