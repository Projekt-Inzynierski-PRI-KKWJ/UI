import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentSearchComponent } from './components/student-search.component';

const routes: Routes = [
  {
    path: '',
    component: StudentSearchComponent
  },
  {
    path: ':indexNumber',
    component: StudentSearchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentInfoRoutingModule { }
