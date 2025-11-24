import { Component, OnInit } from '@angular/core';
import { ARTargetService, ARTarget } from '../../services/ar-target.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ar-view',
  templateUrl: './ar-view.component.html',
  styleUrls: ['./ar-view.component.scss'],
  standalone: false,
})
export class ArViewComponent implements OnInit {
  targets: ARTarget[] = [];
  currentUserId: string | null = null;

  constructor(
    private arTargetService: ARTargetService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.uid : null;
    if (this.currentUserId) {
      this.targets = await this.arTargetService.getTargets(this.currentUserId);
    }
  }
}
