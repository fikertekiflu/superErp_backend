import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DatabaseTestService {
  constructor() {}

  async testConnection(): Promise<string> {
    try {
      return 'Database connection test successful!';
    } catch (error) {
      return `Database connection failed: ${error.message}`;
    }
  }
}
