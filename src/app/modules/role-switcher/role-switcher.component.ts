import { combineLatest, map, Observable } from "rxjs";
import { loadUser } from "../user/state/user.actions";
import { Component, OnInit } from "@angular/core";
import { UserService } from "../user/user.service";
import { RoleSwitcherService } from "./role-switcher.service";
import { State } from "src/app/app.state";
import { Store } from "@ngrx/store";
import { AppComponent } from "src/app/app.component";

@Component({
  selector: 'app-role-switcher',
  templateUrl: './role-switcher.component.html',
  styleUrls: ['./role-switcher.component.scss'],
})
export class RoleSwitcherComponent implements OnInit {

  users$!: Observable<any[]>;
  currentUser$ = this.store.select('user');

  constructor(
    private store: Store<State>,
    private userService: UserService,
    private roleSwitcherService: RoleSwitcherService,
    private app: AppComponent
  ) {}

  ngOnInit() {
    this.users$ = combineLatest([
      this.userService.students$,
      this.userService.supervisors$,
      this.currentUser$
    ]).pipe(
      map(([students, supervisors, me]) => [
        {
          indexNumber: me.indexNumber,
          label: 'me',
          isMe: true
        },
        ...students.map(s => ({
          indexNumber: s.indexNumber,
          label: `${s.indexNumber} (student)`,
          isMe: false
        })),
        ...supervisors.map(s => ({
          indexNumber: s.indexNumber,
          label: `${s.indexNumber} (supervisor)`,
          isMe: false
        }))
      ])
    );
  }

  getLabel(user: any): string {
    if (user.isMe) {
      return `${this.app.translations['me'] || 'me'} (coordinator)`;
    }
    return user.label;
  }

  onRoleChange(selectedIndex: string, myIndex: string) {
    if (selectedIndex === myIndex) {
      this.roleSwitcherService.switchBackToMe().subscribe(() =>
        this.store.dispatch(loadUser())
      );
    } else {
      this.roleSwitcherService.switchToUser(selectedIndex).subscribe(() =>
        this.store.dispatch(loadUser())
      );
    }
  }
}
