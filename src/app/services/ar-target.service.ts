import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ARTarget {
  id: string;
  user_id: string;
  name: string;
  type: 'marker' | 'nft';
  markerPreset?: string;
  patternUrl?: string;
  nftUrlBase?: string;
  contentUrl: string;
  scale?: string;
  position?: string;
  rotation?: string;
}

@Injectable({ providedIn: 'root' })
export class ARTargetService {
  constructor(private supabase: SupabaseService) {}

  async getTargets(): Promise<ARTarget[]> {
    return await this.supabase.listTargets();
  }

  async addTarget(target: ARTarget) {
    return await this.supabase.saveTarget(target);
  }

  async updateTarget(id: string, updates: Partial<ARTarget>) {
    return await this.supabase.updateTarget(id, updates);
  }

  async deleteTarget(id: string) {
    return await this.supabase.deleteTarget(id);
  }
}
