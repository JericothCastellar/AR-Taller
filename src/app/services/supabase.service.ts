import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async listTargets() {
    const { data, error } = await this.supabase.from('targets').select('*');
    if (error) throw error;
    return data;
  }

  async uploadImage(path: string, file: File) {
    const { data, error } = await this.supabase.storage.from('ar-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = this.supabase.storage.from('ar-assets').getPublicUrl(path);
    return pub.publicUrl;
  }

  async saveTarget(target: any) {
    const { data, error } = await this.supabase.from('targets').insert(target).select();
    if (error) throw error;
    return data;
  }

  async updateTarget(id: string, updates: any) {
    const { data, error } = await this.supabase.from('targets').update(updates).eq('id', id).select();
    if (error) throw error;
    return data;
  }

  async deleteTarget(id: string) {
    const { error } = await this.supabase.from('targets').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
