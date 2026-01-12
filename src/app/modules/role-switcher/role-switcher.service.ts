import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class RoleSwitcherService {

  constructor(private http: HttpClient) {}

  switchToUser(index: string) {
    return this.http.post(
      `./pri/auth/impersonation/${index}`,
      null,
      { withCredentials: true }
    );
  }

  switchBackToMe() {
    return this.http.post(
      `./pri/auth/impersonation/exit`,
      null,
      { withCredentials: true }
    );
  }
}
