import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';




@Component({
  selector: 'app-initialize-coordinator',
  templateUrl: './initialize-coordinator.component.html',
  styleUrls: ['./initialize-coordinator.component.scss']
})
export class InitializeCoordinatorComponent {
form = this.fb.group({
  indexNumber: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
  name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
  last_name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
  email: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] })
});


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}



  ngOnInit(): void {
    // Check coordinator count on load
    this.userService.checkInitializationStatus().subscribe({
      next: (count) => {
        if (count > 0) {
          // If already initialized, go back to login
          this.router.navigateByUrl('/login');
        }
        // If count === 0, stay on this page and allow initialization
      },
      error: () => {
        this.snackBar.open('Failed to check coordinator count', 'Close',{duration: 2000});
      }
    });
  }



onSubmit(): void {
  if (this.form.valid) {
    const payload = this.form.getRawValue(); 
    this.userService.initializeCoordinator(payload).subscribe({
      next: () => {this.snackBar.open('Coordinator initialized successfully', 'Close',{duration: 2000});
      this.router.navigateByUrl('/login');
    },
      error: (err) => {
        console.error('POST failed:', err);
        this.snackBar.open('Failed to initialize coordinator', 'Close',{duration: 2000});
      }
    });
  }
}

}
