import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { ROLE_TYPES, User } from '@app/models';
import { AuthenticationService, CardService, EventService, LoaderService, MonitoringService, UserService } from '@app/services';

import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { Router } from '@angular/router';


const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'user-list.component.html',
  styleUrls: ['user-list.component.scss'],
  providers: []
})

export class UserListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;

  readonly roleTypes = ROLE_TYPES;
  users: User[] = null;
  has_ssh_key: Map<number, boolean> = new Map<number, boolean>();

  registering_card: number = null;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    @Inject('UserService') private userService: UserService,
    @Inject('CardService') private cardService: CardService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });
    this.updateComponent();

    this.baseSubscriptions.push(
      this.eventService.listen('card_registered')
        .subscribe(result => {
          this.registering_card = null;
          this.snackBar.dismiss();
          if (result) {
            // registered
            this.snackBar.open($localize`:@@card registered:Card registered!`, null, {duration: environment.snackDuration});
          }
          else if (result === false) {
            // not registered
            this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, {duration: environment.snackDuration});
          }
          else if (result === null) {
            // time expired
            this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, {duration: environment.snackDuration});
          }
          this.updateComponent();
        })
    );
  }

  ngOnDestroy() {
    super.destroy();
  }

  navigateToUserEdit(userId: number) {
    this.router.navigate(['/user', userId]);
  }

  updateComponent() {
    this.userService.getUsers()
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(users => {
        this.users = users;

        // iterate users and ask for has_ssh_key
        this.users.forEach((user) => {
          this.userService.hasSshKey(user.id)
            .subscribe((res) => {
              this.has_ssh_key.set(user.id, res);
            });
        });

        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  canBeDeleted(userId: number) {
    return (
      this.users.filter(x => x.role === ROLE_TYPES.ADMIN).length > 1 ||
      this.users.find(x => x.id === userId).role !== ROLE_TYPES.ADMIN
    )
  }

  onUserDeleted(userId: number) {
    this.updateComponent();
  }
}
