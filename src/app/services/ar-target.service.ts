import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ARTarget {
  id: string;
  user_id: string;
  name: string;
  type: 'marker' | 'nft' | 'image';
  contenturl: string;
  markerpreset?: string;
  patternurl?: string;
  nfturlbase?: string;
  scale?: string;
  position?: string;
  rotation?: string;
}

@Injectable({ providedIn: 'root' })
export class ARTargetService {
  constructor(private supabase: SupabaseService) {}

  async getTargets(userId: string): Promise<ARTarget[]> {
    return await this.supabase.listTargets(userId);
  }

  async addTarget(target: Partial<ARTarget>) {
    return await this.supabase.saveTarget(target);
  }

  async updateTarget(id: string, updates: Partial<ARTarget>) {
    return await this.supabase.updateTarget(id, updates);
  }

  async deleteTarget(id: string) {
    return await this.supabase.deleteTarget(id);
  }
}
