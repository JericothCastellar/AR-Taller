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
    if (!userId) {
      console.error('listTargets called without userId');
      return [];
    }

    const { data, error } = await this.supabase
      .from('targets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('ListTargets error:', error.message, error.details);
      throw error;
    }
    return data || [];
  }

  async uploadImage(uid: string, file: File): Promise<string> {
    const base = environment.supabaseUrl.replace(/\/$/, '');
    const bucket = 'ar-assets';
    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, '-');
    const pathInBucket = `${uid}/${timestamp}-${safeName}`;
    const putUrl = `${base}/storage/v1/object/${bucket}/${encodeURIComponent(pathInBucket)}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${environment.supabaseAnonKey}`,
      apikey: environment.supabaseAnonKey,
      'x-upsert': 'true'
    };
    if (file.type) headers['Content-Type'] = file.type;

    const res = await fetch(putUrl, { method: 'PUT', headers, body: file });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed ${res.status}: ${text}`);
    }

    return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(pathInBucket)}`;
  }

  async deleteImage(publicUrl: string): Promise<void> {
    const base = environment.supabaseUrl.replace(/\/$/, '');
    const prefix = `${base}/storage/v1/object/public/`;
    if (!publicUrl.startsWith(prefix)) throw new Error('Invalid public URL');

    const cleanUrl = decodeURIComponent(publicUrl.split('?')[0]);
    const path = cleanUrl.slice(prefix.length);

    const parts = path.split('/');
    const bucket = parts.shift();
    const filePath = parts.join('/');
    if (!bucket || !filePath) throw new Error('Invalid path for deletion');

    const deleteUrl = `${base}/storage/v1/object/${bucket}/${encodeURIComponent(filePath)}`;

    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${environment.supabaseAnonKey}`,
        apikey: environment.supabaseAnonKey
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delete failed ${res.status}: ${text}`);
    }
  }

  async saveTarget(target: any) {
    const { data, error } = await this.supabase.from('targets').insert(target).select();
    if (error) {
      console.error('SaveTarget error:', error.message, error.details);
      throw error;
    }
    return data;
  }

  async updateTarget(id: string, updates: any) {
    const { data, error } = await this.supabase.from('targets').update(updates).eq('id', id).select();
    if (error) {
      console.error('UpdateTarget error:', error.message, error.details);
      throw error;
    }
    return data;
  }

  async deleteTarget(id: string) {
    const { error } = await this.supabase.from('targets').delete().eq('id', id);
    if (error) {
      console.error('DeleteTarget error:', error.message, error.details);
      throw error;
    }
    return true;
  }
}
