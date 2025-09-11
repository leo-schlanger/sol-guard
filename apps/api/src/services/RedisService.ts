import { createClient, RedisClientType } from 'redis'
import { config } from '../config'

export class RedisService {
  private client: RedisClientType

  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
    })
  }

  async initialize(): Promise<void> {
    try {
      await this.client.connect()
      console.log('✅ Redis connection initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error)
      throw error
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async close(): Promise<void> {
    await this.client.quit()
  }
}
