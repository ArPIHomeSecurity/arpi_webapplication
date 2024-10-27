import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { UserDeleteDialogComponent } from './user-delete.component';
import { User, MONITORING_STATE, ROLE_TYPES } from '@app/models';
import { EventService, LoaderService, MonitoringService, UserService } from '@app/services';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss']
})
export class UserDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;

  userId: number;
  user: User = undefined;
  userForm: UntypedFormGroup;
  roles: any = [];
  hide = true;
  action: string;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('UserService') private userService: UserService,

    public router: Router,

    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
      super(eventService, loader, monitoringService);

      this.route.paramMap.subscribe(params => {
        if (params.get('id') != null) {
          this.userId = +params.get('id');
        }
      });
  }

  ngOnInit() {
    super.initialize();

    for (const role in ROLE_TYPES) {
      if (ROLE_TYPES.hasOwnProperty(role)) {
        this.roles.push({name: role, value: ROLE_TYPES[role]});
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
    const accessCode = new UntypedFormControl(user.accessCode, [Validators.pattern('^\\d{4,12}$')]);

    if (!user.id) {
      accessCode.setValidators([Validators.required, Validators.pattern('^\\d{4,12}$')]);
    }

    this.userForm = this.fb.group({
      name: new FormControl(user.name, [Validators.required, Validators.maxLength(32)]),
      role: user.role,
      hasRegistrationCode: user.hasRegistrationCode,
      accessCode,
      comment: user.comment,
    });
  }

  onSubmit() {
    const user = this.prepareUser();
    if (this.userId != null) {
      this.action = 'update';
      this.userService.updateUser(user)
        .subscribe({
          next: _ => this.router.navigate(['/users']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    } else {
      this.action = 'create';
      this.userService.createUser(user)
        .subscribe({
          next: _ => this.router.navigate(['/users']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    }
  }

  onCancel() {
    this.router.navigate(['/users']);
  }

  prepareUser(): User {
    const formModel = this.userForm.value;

    const user: User = new User();
    user.id = this.userId;
    user.name = formModel.name;
    user.role = formModel.role;
    user.comment = formModel.comment;
    user.accessCode = formModel.accessCode;

    return user;
  }

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.user.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'delete';
          this.userService.deleteUser(userId)
            .subscribe({
              next: _ => this.router.navigate(['/users']),
              error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
            });
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
        }
      }
    });
  }
}
