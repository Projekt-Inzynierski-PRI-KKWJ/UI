import { CommonModule } from "@angular/common";
import { RoleSwitcherComponent } from "./role-switcher.component";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgModule } from "@angular/core";



@NgModule({
  declarations: [RoleSwitcherComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  exports: [RoleSwitcherComponent] 
})
export class RoleSwitcherModule {}
