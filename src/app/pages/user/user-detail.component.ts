import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { User, ROLE_TYPES, UserUpdate, UserCreate, MONITORING_STATE } from '@app/models';
import { AuthenticationService, EventService, LoaderService, MonitoringService, UserService } from '@app/services';

import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss']
})
export class UserDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {

  userId: number = null;
  user: User = null;
  userForm: FormGroup;
  roles: any = [];
  hideOld = true;
  hideNew = true;
  isMyProfile = false;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('UserService') private userService: UserService,

    public router: Router,

    private fb: FormBuilder,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id === 'add') {
        this.userId = null;
        this.isMyProfile = false;
      }
      else if (id === 'my-user') {
        this.userId = this.authenticationService.getUserId();
        this.isMyProfile = true;
      }
      else if (id != null) {
        this.userId = parseInt(id, 10);
        this.isMyProfile = false;
      }
    });
  }

  ngOnInit() {
    super.initialize();

    for (const role in ROLE_TYPES) {
      if (ROLE_TYPES.hasOwnProperty(role)) {
        this.roles.push({ name: role, value: ROLE_TYPES[role] });
      }
    }

    if (this.userId != null) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });
      this.userService.getUser(this.userId)
        .pipe(
          catchError((error) => {
            if (error.status === 404) {
              this.user = null;
            }
            return throwError(() => error);
          }),
          finalize(() => this.loader.display(false))
        )
        .subscribe({
          next: (user) => {
            this.user = user;
            this.updateForm(this.user);
            this.loader.display(false);
          },
          error: (error) => {
            // handle error
          },
          complete: () => {
            // handle completion
          }
        });
    } else {
      this.user = new User();
      this.user.name = null;
      this.user.role = 'user';
      this.user.accessCode = null;
      this.updateForm(this.user);
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(user: User) {
    const accessCode = new FormControl(user.accessCode, [Validators.pattern('^\\d{4,12}$')]);

    if (!user.id) {
      accessCode.setValidators([Validators.required, Validators.pattern('^\\d{4,12}$')]);
    }

    this.userForm = this.fb.group({
      name: new FormControl(user.name, [Validators.required, Validators.maxLength(32)]),
      role: user.role,
      hasRegistrationCode: user.hasRegistrationCode,
      oldAccessCode: new FormControl('', [Validators.pattern('^\\d{4,12}$')]),
      newAccessCode: new FormControl('', [Validators.pattern('^\\d{4,12}$')]),
      comment: user.comment,
    });
  }

  onSave() {
    if (this.userId != null) {
      const user = this.prepareUserUpdate();
      this.userService.updateUser(user)
        .subscribe({
          next: _ => {
            // reset biometricEnabled if access code has changed
            if (user.oldAccessCode && user.newAccessCode && user.oldAccessCode !== user.newAccessCode) {
              localStorage.setItem('biometricEnabled', JSON.stringify(null));
            }

            if (this.isMyProfile) {
              this.router.navigate(['/my-user']);
            }
            else {
              this.router.navigate(['/users']);
            }
          },
          error: _ => this.snackBar.open($localize`:@@failed update:Failed to update!`, null, { duration: environment.snackDuration })
        });
    } else {
      const user = this.prepareUserCreate();
      this.userService.createUser(user)
        .subscribe({
          next: _ => {
            this.router.navigate(['/users'])
          },
          error: _ => this.snackBar.open($localize`:@@failed create:Failed to create!`, null, { duration: environment.snackDuration })
        });
    }
  }

  onCancel() {
    this.router.navigate(['/users']);
  }

  prepareUserUpdate(): UserUpdate {
    const userModel = this.userForm.value;

    const user: UserUpdate = new UserUpdate();
    user.id = this.userId;
    user.name = userModel.name;
    user.role = userModel.role;
    user.comment = userModel.comment;
    user.oldAccessCode = userModel.oldAccessCode;
    user.newAccessCode = userModel.newAccessCode;

    return user;
  }

  prepareUserCreate(): UserCreate {
    const userModel = this.userForm.value;

    const user: UserCreate = new UserCreate();
    user.name = userModel.name;
    user.role = userModel.role;
    user.accessCode = userModel.newAccessCode;
    user.comment = userModel.comment;

    return user;
  }

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      data: {
        title: $localize`:@@delete user:Delete user`,
        message: $localize`:@@delete user message:Are you sure you want to delete the user "${this.user.name}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn',
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ],
        width: '450px',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.userService.deleteUser(userId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => this.router.navigate(['/users']),
              error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
            });
        }
        else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, { duration: environment.snackDuration });
        }
      }
    });
  }
}
