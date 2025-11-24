import { Component } from '@angular/core';
import { ARTargetService, ARTarget } from '../services/ar-target.service';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {
  targets: ARTarget[] = [];
  selectedFile: File | null = null;
  currentUserId: string | null = null;
  isLoading = false;

  constructor(
    private arTargetService: ARTargetService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  async ionViewWillEnter() {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.uid : null;
    console.log('Usuario desde AuthService:', user);
    console.log('UID actual en Home:', this.currentUserId);

    if (this.currentUserId) {
      try {
        this.targets = await this.arTargetService.getTargets(this.currentUserId);
      } catch (err) {
        console.error('Error cargando targets:', err);
        this.targets = [];
      } finally {
        this.isLoading = false;
      }
    } else {
      console.warn('No hay usuario logueado, redirigiendo a login');
      this.targets = [];
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log('Archivo seleccionado:', this.selectedFile);
  }

  async uploadImage() {
    console.log('UID actual en uploadImage:', this.currentUserId);
    console.log('Archivo en uploadImage:', this.selectedFile);

    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }
    if (!this.currentUserId) {
      console.error('User not logged in');
      this.router.navigate(['/login']);
      return;
    }

    try {
      const publicUrl = await this.supabaseService.uploadImage(this.currentUserId, this.selectedFile);

      const newTarget: Partial<ARTarget> = {
        name: this.selectedFile.name,
        type: 'marker',
        contenturl: publicUrl,
        user_id: this.currentUserId,
      };

      await this.arTargetService.addTarget(newTarget);
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  async deleteTarget(target: ARTarget) {
    if (!this.currentUserId) {
      console.error('User not logged in, cannot delete');
      this.router.navigate(['/login']);
      return;
    }

    if (target.contenturl) {
      try {
        await this.supabaseService.deleteImage(target.contenturl);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    try {
      await this.arTargetService.deleteTarget(target.id);
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
    } catch (err) {
      console.error('Error deleting target record:', err);
    }
  }

  async editTarget(target: ARTarget) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Target',
      inputs: [
        { name: 'name', type: 'text', value: target.name, placeholder: 'Nombre' },
        { name: 'type', type: 'text', value: target.type, placeholder: 'Tipo (marker/nft)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              const updates: Partial<ARTarget> = { name: data.name, type: data.type };
              await this.arTargetService.updateTarget(target.id, updates);
              if (this.currentUserId) {
                this.targets = await this.arTargetService.getTargets(this.currentUserId);
              }
            } catch (err) {
              console.error('Error updating target:', err);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async logout() {
    this.targets = []; 
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
