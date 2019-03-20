import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { MatDialog, MatSnackBar } from '@angular/material';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { UserDeleteDialog } from './user-delete.component';
import { User } from '../models';
import { EventService, LoaderService, MonitoringService, UserService} from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  moduleId: module.id,
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss'],
  providers: []
})
export class UserDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  userId: number;
  user: User = null;
  userForm: FormGroup;
  roles: any = [];

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private location: Location) {
      super(loader, eventService, monitoringService)

      this.route.paramMap.subscribe(params => {
        if (params.get('id') != null) {
          this.userId = +params.get('id');
        }
      });
  }

  ngOnInit() {
    super.initialize();

    for (let role in environment.ROLE_TYPES) {
      this.roles.push({'name': role, 'value': environment.ROLE_TYPES[role]});
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
      });
    } else {
      this.user = new User;
      this.user.name = null;
      this.user.role = 'user';
      this.user.access_code = null;
      this.updateForm(this.user);
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(user: User) {
    this.userForm = this.fb.group({
      name: user.name,
      role: user.role,
      accessCode: new FormControl(user.access_code, [Validators.pattern('^\\d{4,8}$')]),
    });
  }

  onSubmit() {
    const user = this.prepareSaveUser();
    if (this.userId != null) {
      this.userService.updateUser(user).subscribe(_ => this.router.navigate(['/users']),
          _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
      );
    } else {
      this.userService.createUser(user).subscribe(_ => this.router.navigate(['/users']),
          _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION}));
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
    user.access_code = formModel.accessCode;

    return user;
  }

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeleteDialog, {
      width: '250px',
      data: {
        name: this.user.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(userId)
          .subscribe(_ => this.router.navigate(['/users']),
              _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION}));
      }
    });
  }
}
