import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { MatDialog, MatSnackBar } from '@angular/material';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { UserDeleteDialog } from './user-delete.component';
import { ArmType, User, MonitoringState, String2MonitoringState } from '../models/index';
import { EventService, LoaderService, MonitoringService, UserService} from '../services/index';

import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  moduleId: module.id,
  templateUrl: './user-detail.component.html',
  styleUrls: ['user-detail.component.scss'],
  providers: []
})
export class UserDetailComponent implements OnInit, OnDestroy {
  userId: number;
  user: User = null;
  userForm: FormGroup;
  roles: any = [];
  monitoringState: MonitoringState;
  MonitoringState: any = MonitoringState;
  subscriptions: Subscription[];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private eventService: EventService,
    private loader: LoaderService,
    private monitoringService: MonitoringService,
    private userService: UserService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private location: Location) {

    this.route.paramMap.subscribe(params => {
      if (params.get('id') != null) {
        this.userId = +params.get('id');
      }
    });
  }

  ngOnInit() {
    for (let role in environment.ROLE_TYPES) {
      this.roles.push({'name': role, 'value': environment.ROLE_TYPES[role]});
    }

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => {
        this.monitoringState = monitoringState;
        this.onStateChange();
    });

    this.subscriptions = [];
    this.subscriptions.push(
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => {
          this.monitoringState = String2MonitoringState(monitoringState);
          this.onStateChange();
    }));

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
    this.subscriptions.forEach(_ => _.unsubscribe());
    this.subscriptions = [];
    this.loader.clearMessage();
  }

  onStateChange() {
    if (this.monitoringState !== MonitoringState.READY) {
      this.loader.setMessage('The system is not ready, you can\'t make changes in the configuration!');
    } else {
      this.loader.clearMessage();
    }
  }

  updateForm(user: User) {
    this.userForm = this.fb.group({
      name: user.name,
      role: user.role,
      accessCode: new FormControl(user.access_code, [Validators.pattern('^\\d{4,8}$')]),
    });
  }

  onSubmit() {
    console.log('User: ', this.user);
    const user = this.prepareSaveUser();
    if (this.userId != null) {
      this.userService.updateUser(user).subscribe(null,
          _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
      );
    } else {
      this.userService.createUser(user).subscribe(null,
          _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION}));
    }
    this.router.navigate(['/users']);
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
