import { Component, OnInit, OnDestroy } from '@angular/core';

import { MatDialog, MatSnackBar } from '@angular/material';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { UserDeleteDialog } from './user-delete.component';
import { User } from '../models/user';
import { LoaderService, EventService, MonitoringService, UserService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'user-list.component.html',
  styleUrls: ['user-list.component.scss'],
  providers: []
})

export class UserListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  users: User[] = null;
  environment = environment;

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    private userService: UserService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(loader, eventService, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
  }

  ngOnDestroy() {
    super.destroy();
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
