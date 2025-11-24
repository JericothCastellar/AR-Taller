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
    if (this.currentUserId) {
      try {
        this.targets = await this.arTargetService.getTargets(this.currentUserId);
      } catch {
        this.targets = [];
      } finally {
        this.isLoading = false;
      }
    } else {
      this.targets = [];
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.selectedFile = file;
  }

  async uploadAsset() {
    if (!this.selectedFile) {
      await this.showAlert('Subida', 'No seleccionaste archivo.');
      return;
    }
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    try {
      const originalName = this.selectedFile.name;
      const isImage = !!(this.selectedFile.type && this.selectedFile.type.startsWith('image/'));
      const publicUrl = isImage
        ? await this.supabaseService.uploadImage(this.currentUserId, this.selectedFile)
        : await this.supabaseService.uploadFile(this.currentUserId, this.selectedFile);

      const newTarget: Partial<ARTarget> = {
        name: originalName,
        type: isImage ? 'image' : 'marker',
        contenturl: publicUrl,
        user_id: this.currentUserId,
      };

      await this.arTargetService.addTarget(newTarget);
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
      await this.showAlert('Subida', 'Archivo subido y target creado correctamente.');
      this.selectedFile = null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Revisa la consola.';
      await this.showAlert('Error', 'Falló la subida: ' + msg);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteTarget(target: ARTarget) {
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }
    const ok = await this.confirm('Eliminar', `¿Eliminar el target "${target.name}"?`);
    if (!ok) return;
    if (target.contenturl) {
      try {
        await this.supabaseService.deleteImage(target.contenturl);
      } catch {}
    }
    try {
      await this.arTargetService.deleteTarget(target.id);
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
      await this.showAlert('Eliminar', 'Target eliminado.');
    } catch {
      await this.showAlert('Error', 'No se pudo eliminar el target.');
    }
  }

  async editTarget(target: ARTarget) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Target',
      inputs: [
        { name: 'name', type: 'text', value: target.name, placeholder: 'Nombre' },
        { name: 'type', type: 'text', value: target.type, placeholder: 'Tipo (marker/image/nft)' },
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
              this.showToast('Target actualizado.');
            } catch {
              this.showToast('Error al actualizar.');
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

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  private async confirm(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'OK', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private async showToast(message: string) {
    const alert = await this.alertCtrl.create({ header: 'Info', message, buttons: ['OK'] });
    await alert.present();
  }
}
