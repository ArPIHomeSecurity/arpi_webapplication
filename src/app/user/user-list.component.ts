import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialog, MatSnackBar } from '@angular/material';

import { UserDeleteDialog } from './user-delete.component';
import { ArmType } from '../models/index';
import { User } from '../models/user';
import { LoaderService, EventService, MonitoringService, UserService } from '../services/index';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'user-list.component.html',
  styleUrls: ['user-list.component.scss'],
  providers: [MonitoringService, UserService]
})

export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = null;
  ArmType:any = ArmType;
  armState: ArmType;
  isDestroyed = false;

  constructor(
    private router: Router,
    private loader: LoaderService,
    private eventService: EventService,
    private monitoringService: MonitoringService,
    private userService: UserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isDestroyed = false;
    this.updateComponent();

    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState);
    this.eventService.listen('arm_state_change')
      .subscribe(arm_type => {
        if (arm_type === environment.ARM_DISARM) {
          this.armState = ArmType.DISARMED;
        }
        else if (arm_type === environment.ARM_AWAY) {
          this.armState = ArmType.AWAY;
        }
        else if (arm_type === environment.ARM_STAY) {
          this.armState = ArmType.STAY;
        }
        else {
          console.error('Unknown arm type!', arm_type);
        }
      }
    );
  }

  ngOnDestroy() {
    this.isDestroyed = true;
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
        if (!this.isDestroyed) {
          this.loader.display(false);
        }
    });
  }

  openDeleteDialog(userId: number) {
    let dialogRef = this.dialog.open(UserDeleteDialog, {
      width: '250px',
      data: {
        name: this.users.find(x => x.id == userId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(userId).subscribe(result => this.updateComponent(),
            _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
        );
      }
    });
  }
}
