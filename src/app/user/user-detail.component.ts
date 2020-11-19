import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserDeleteDialogComponent } from './user-delete.component';

import { ConfigurationBaseComponent } from 'src/app/configuration-base/configuration-base.component';
import { User, MonitoringState, ROLE_TYPES } from 'src/app/models';
import { EventService, LoaderService, MonitoringService, UserService } from 'src/app/services';

import { environment } from 'src/environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss']
})
export class UserDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;

  userId: number;
  user: User = null;
  userForm: FormGroup;
  roles: any = [];
  hide = true;
  action: string;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('UserService') private userService: UserService,

    public router: Router,

    private fb: FormBuilder,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private location: Location) {
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
        .subscribe(user => {
            this.user = user;
            this.updateForm(this.user);
            this.loader.display(false);
        }
      );
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
      name: user.name,
      role: user.role,
      hasRegistrationCode: user.hasRegistrationCode,
      accessCode,
      comment: user.comment,
    });
  }

  onSubmit() {
    const user = this.prepareSaveUser();
    if (this.userId != null) {
      this.action = 'update';
      this.userService.updateUser(user)
        .subscribe(
          _ => this.router.navigate(['/users']),
          error => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION})
        );
    } else {
      this.action = 'create';
      this.userService.createUser(user)
        .subscribe(
          _ => this.router.navigate(['/users']),
          error => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION})
        );
    }
  }

  onCancel() {
    this.location.back();
  }

  prepareSaveUser(): User {
    const formModel = this.userForm.value;

    const user: User = new User();
    user.id = this.userId;
    user.name = formModel.name;
    user.role = formModel.role;
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
        if (this.monitoringState === MonitoringState.READY) {
          this.action = 'delete';
          this.userService.deleteUser(userId)
            .subscribe(
              _ => this.router.navigate(['/users']),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION})
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
