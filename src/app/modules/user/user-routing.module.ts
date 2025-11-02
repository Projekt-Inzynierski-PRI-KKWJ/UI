import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { InitializeCoordinatorComponent } from './initialize-coordinator/initialize-coordinator.component';


const routes: Routes = [
  { path: '', pathMatch: 'full', component: LoginComponent },
    { path: 'initialize-coordinator', component: InitializeCoordinatorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
