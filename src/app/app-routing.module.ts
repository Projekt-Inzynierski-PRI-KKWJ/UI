import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserGuard } from './modules/user/user.guard';
import { CoordinatorGuard } from './modules/user/coordinator.guard';
import { InitializeCoordinatorComponent } from './modules/user/initialize-coordinator/initialize-coordinator.component';

const routes: Routes = [
  { 
    path: 'initialize-coordinator', 
    component: InitializeCoordinatorComponent 
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule)
  },
  {
    path: 'projects',
    loadChildren: () => import('./modules/project/project.module').then(m => m.ProjectModule),
    canActivate: [UserGuard]
  },
  {
    path: 'projects',
    loadChildren: () => import('./modules/project/project.module').then(m => m.ProjectModule),
    canActivate: [UserGuard],
    outlet: 'modal',
  },
  {
    path: 'defense-schedule',
    loadChildren: () => import('./modules/defense-schedule/defense-schedule.module').then(m => m.DefenseScheduleModule),
    canActivate: [UserGuard]
  },
  {
    path: 'defense-schedule',
    loadChildren: () => import('./modules/defense-schedule/defense-schedule.module').then(m => m.DefenseScheduleModule),
    canActivate: [UserGuard],
    outlet: 'modal',
  },
  {
    path: 'data-feed',
    loadChildren: () => import('./modules/data-feed/data-feed.module').then(m => m.DataFeedModule),
    canActivate: [CoordinatorGuard]
  },
  {
    path: 'statistics',
    loadChildren: () => import('./modules/statistics/statistics.module').then(m => m.StatisticsModule),
    canActivate: [CoordinatorGuard]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
