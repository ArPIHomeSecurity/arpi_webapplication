import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialog, MatSnackBar } from '@angular/material';

import { UserDeleteDialog } from './user-delete.component';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { User } from '../models/user';
import { LoaderService, EventService, MonitoringService, UserService } from '../services/index';

import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'user-list.component.html',
  styleUrls: ['user-list.component.scss'],
  providers: []
})

export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = null;
  monitoringState: MonitoringState;
  MonitoringState: any = MonitoringState;
  subscriptions: Subscription[];

  environment = environment;

  constructor(
    private router: Router,
    private loader: LoaderService,
    private eventService: EventService,
    private monitoringService: MonitoringService,
    private userService: UserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
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

    this.updateComponent();
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

  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.userService.getUsers()
      .subscribe(users => {
        this.users = users;
        this.loader.display(false);
    });
  }

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeleteDialog, {
      width: '250px',
      data: {
        name: this.users.find(x => x.id === userId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(userId).subscribe(_ => this.updateComponent(),
            _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
        );
      }
    });
  }
}
