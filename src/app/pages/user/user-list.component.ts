import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { UserDeleteDialogComponent } from './user-delete.component';
import { UserDeviceRegistrationDialogComponent } from './user-device-registration.component';
import { Card, MONITORING_STATE, ROLE_TYPES, User } from '@app/models';
import { AuthenticationService, CardService, EventService, LoaderService, MonitoringService, UserService } from '@app/services';

import { environment } from '@environments/environment';
import { UserCardDeleteDialogComponent } from '.';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { UserSshKeySetupDialogComponent } from './user-ssh-key-setup.component';


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
  cards: Card[] = [];
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
    private snackBar: MatSnackBar
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

  updateComponent() {
    forkJoin({
      users: this.userService.getUsers(),
      cards: this.cardService.getCards()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.users = results.users;

        // iterate users and ask for has_ssh_key
        this.users.forEach((user) => {
          this.userService.hasSshKey(user.id)
            .subscribe((res) => {
              this.has_ssh_key.set(user.id, res);
            });
        });

        if (results.cards) {
          this.cards = results.cards;
        }
        else {
          this.cards = []
        }
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

  openDeleteDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.users.find(x => x.id === userId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.userService.deleteUser(userId)
            .subscribe({
              next: _ => this.updateComponent(),
              error: _ => {
                this.loader.disable(false);
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {duration: environment.snackDuration});
              }
            });
        } else {
          this.snackBar.open($localize`:@@cant delete:Cant delete!`, null, {duration: environment.snackDuration});
        }
      }
    });
  }

  openDeleteCardDialog(cardId: number) {
    const dialogRef = this.dialog.open(UserCardDeleteDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.cardService.deleteCard(cardId)
            .subscribe({
              next: _ => this.updateComponent(),
              error: _ => {
                this.loader.disable(false);
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {duration: environment.snackDuration});
              }
            });
        } else {
          this.snackBar.open($localize`:@@cant delete:Cant delete!`, null, {duration: environment.snackDuration});
        }
      }
    });
  }

  getCards(userId: number): Card[] {
    const results: Card[] = [];
    this.cards.forEach((card) => {
      if (card.userId === userId) {
        results.push(card);
      }
    });

    return results;
  }

  toggleCard(cardId: number) {
    this.cards.forEach((card) => {
      if (card.id === cardId) {
        // clone the card, change the state and update
        let tmpCard = Object.assign({}, card)
        tmpCard.enabled = !card.enabled;

        this.loader.disable(true);
        this.cardService.updateCard(tmpCard)
        .subscribe({
          next: _ => this.updateComponent(),
          error: _ => {
            this.loader.disable(false);
            this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
          }
        });
      }
    });
  }

  onClickRegisterCard(userId: number){
    this.userService.registerCard(userId)
      .subscribe(() => {
        this.registering_card = userId;
    });
  }

  openSshKeySetupDialog(userId: number) {
    const dialogRef = this.dialog.open(UserSshKeySetupDialogComponent, {
      width: '350px',
      data: this.users.find(x => x.id === userId),
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loader.disable(true);
      this.updateComponent();
    });
  }

  openDeviceRegistrationDialog(userId: number) {
    const dialogRef = this.dialog.open(UserDeviceRegistrationDialogComponent, {
      width: '350px',
      data: this.users.find(x => x.id === userId),
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loader.disable(true);
      this.updateComponent();
    });
  }

  removeRegistrationCode(userId: number) {
    this.loader.disable(true);
    this.userService.deleteRegistrationCode(userId)
      .subscribe(_ => this.updateComponent());
  }

  deleteSSHKey(userId: number) {
    this.loader.disable(true);
    this.userService.deleteSshKey(userId)
      .subscribe(_ => this.updateComponent());
  }
}
