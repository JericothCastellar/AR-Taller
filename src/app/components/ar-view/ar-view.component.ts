import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ARTargetService, ARTarget } from '../../services/ar-target.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-ar-view',
  templateUrl: './ar-view.component.html',
  styleUrls: ['./ar-view.component.scss'],
  standalone: false,
})
export class ArViewComponent implements OnInit, AfterViewInit, OnDestroy {
  targets: ARTarget[] = [];
  currentUserId: string | null = null;
  loading = true;
  error: string | null = null;

  // estado de detección
  private detected = false;
  private intervalId: any;

  constructor(
    private arTargetService: ARTargetService,
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.uid : null;

    if (!this.currentUserId) {
      this.error = 'No se encontró usuario autenticado.';
      this.loading = false;
      return;
    }

    try {
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
      console.log('Targets cargados:', this.targets);

      for (const target of this.targets) {
        if (target.type === 'nft' && target.nfturlbase) {
          console.log(`Verificando descriptores NFT para: ${target.name}`);
          await this.supabaseService.verifyNftDescriptors(target.nfturlbase);
        }
      }
    } catch (err) {
      console.error('Error cargando targets:', err);
      this.error = 'Error cargando targets';
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit() {
    // cada 5 segundos, si no hay detección, loguea mensaje
    this.intervalId = setInterval(() => {
      if (!this.detected) {
        console.log('No hemos detectado ninguna imagen');
      }
    }, 5000);

    // enganchar eventos de markers y nft
    const sceneEl = document.querySelector('a-scene');
    if (sceneEl) {
      sceneEl.addEventListener('markerFound', () => {
        this.detected = true;
        console.log('Imagen detectada');
      });
      sceneEl.addEventListener('markerLost', () => {
        this.detected = false;
        console.log('Imagen perdida');
      });
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  trackByTargetId(index: number, target: ARTarget): string {
    return target.id;
  }

  // Ahora usamos directamente los valores width y height sin dividir
  getWidth(target: ARTarget): string {
    if (target.width) {
      return target.width; // Ejemplo: "616"
    }
    if (target.scale) {
      const parts = target.scale.split(' ');
      return parts[0] || '20'; // valor por defecto más grande
    }
    return '20';
  }

  getHeight(target: ARTarget): string {
    if (target.height) {
      return target.height; // Ejemplo: "900"
    }
    if (target.scale) {
      const parts = target.scale.split(' ');
      return parts[1] || '30'; // valor por defecto más grande
    }
    return '30';
  }
}
