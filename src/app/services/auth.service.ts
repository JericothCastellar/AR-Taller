import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);

  async login(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    const user = result.user;

    const usuario = { uid: user.uid, email: user.email };
    localStorage.setItem('usuario', JSON.stringify(usuario));

    return user;
  }

  async register(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = result.user;

    const usuario = { uid: user.uid, email: user.email };
    localStorage.setItem('usuario', JSON.stringify(usuario));

    return user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.removeItem('usuario');
  }

  getCurrentUser(): { uid: string; email: string | null } | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }
}
