import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserDeleteDialogComponent } from './user-delete.component';
import { UserDeviceRegistrationDialogComponent } from './user-device-registration.component';

import { ConfigurationBaseComponent } from 'src/app/configuration-base/configuration-base.component';
import { MonitoringState, ROLE_TYPES, User } from 'src/app/models';
import { EventService, LoaderService, MonitoringService } from 'src/app/services';
import { environment } from 'src/environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'user-list.component.html',
  styleUrls: ['user-list.component.scss'],
  providers: []
})

export class UserListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;
  
  action: string;
  users: User[] = null;
  readonly ROLE_TYPES = ROLE_TYPES;

  constructor(
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    @Inject('UserService') private userService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
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
      }
    );
  }

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.users.find(x => x.id === userId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.action = 'delete';
          this.userService.deleteUser(userId)
            .subscribe(
              _ => this.updateComponent(),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION})
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  openDeviceRegistrationDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeviceRegistrationDialogComponent, {
      width: '350px',
      data: this.users.find(x => x.id === userId),
    });

    dialogRef.afterClosed().subscribe(result => {
      this.updateComponent();
    });
  }

  removeRegistrationCode(userId: number) {
    this.userService.deleteRegistrationCode(userId)
      .subscribe(_ => this.updateComponent());
  }
}
