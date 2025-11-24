import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async listTargets(userId: string) {
    const { data, error } = await this.supabase
      .from('targets')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }

  async uploadImage(uid: string, file: File, bucket: string = 'ar-assets'): Promise<string> {
    const path = `${uid}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return `${environment.supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(data.path)}`;
  }

  async uploadFile(uid: string, file: File, bucket: string = 'ar-assets'): Promise<string> {
    const safeName = file.name.replace(/\s+/g, '-');
    const path = `${uid}/${Date.now()}-${safeName}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;

    return `${environment.supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(data.path)}`;
  }

  async deleteImage(publicUrl: string): Promise<void> {
    const base = environment.supabaseUrl.replace(/\/$/, '');
    const prefix = `${base}/storage/v1/object/public/`;
    const cleanUrl = decodeURIComponent(publicUrl.split('?')[0]);
    const path = cleanUrl.slice(prefix.length);
    const parts = path.split('/');
    const bucket = parts.shift();
    const filePath = parts.join('/');
    const { error } = await this.supabase.storage.from(bucket!).remove([filePath]);
    if (error) throw error;
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
