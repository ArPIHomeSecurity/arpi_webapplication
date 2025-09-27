import { Component, EventEmitter, inject, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';

import { Card, ROLE_TYPES, User } from '@app/models';
import { AuthenticationService, BiometricService, CardService, EventService, UserService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { environment } from '@environments/environment';
import { finalize, forkJoin, Observable } from 'rxjs';
import { UserDeviceRegistrationDialogComponent } from '../user-device-registration/user-device-registration.component';
import { UserSshKeySetupDialogComponent } from '../user-ssh-key-setup/user-ssh-key-setup.component';

@Component({
  selector: 'user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  standalone: false
})
export class UserCardComponent implements OnInit {
  @Input() user: User;

  @Input() disabled = false;

  @Input() canManageUser = false;
  @Input() canManageCards = false;
  @Input() canManageSshKeys = false;
  @Input() canManageRegistration = false;

  @Output() onUserDeleted = new EventEmitter<number>();
  @Output() onNavigateToUserEdit = new EventEmitter<void>();

  readonly roleTypes = ROLE_TYPES;

  loading = true;
  cards: Card[] = [];
  registeringCard = false;
  hasSshKey = false;
  biometricAvailable = false;
  useBiometric: boolean = null;

  dialog = inject(MatDialog);

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authenticationService: AuthenticationService,
    @Inject('CardService') private cardService: CardService,
    @Inject('EventService') private eventService: EventService,
    @Inject('UserService') private userService: UserService,
    @Inject('BiometricService') private biometricService: BiometricService,

    private snackBar: MatSnackBar
  ) {
    const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
    const locationId = localStorage.getItem('selectedLocationId');
    this.useBiometric = status[locationId];

    this.eventService.listen('card_registered').subscribe(result => {
      this.registeringCard = false;
      this.snackBar.dismiss();
      if (result) {
        // registered
        this.snackBar.open($localize`:@@card registered:Card registered!`, null, {
          duration: environment.snackDuration
        });
        this.cardService.getCards(this.user.id).subscribe(cards => (this.cards = cards));
      } else if (result === false) {
        // not registered
        this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, {
          duration: environment.snackDuration
        });
      } else if (result === null) {
        // time expired
        this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, {
          duration: environment.snackDuration
        });
      }
    });
  }

  ngOnInit(): void {
    // biometric login is only available for the current user
    const userId = this.authenticationService.getUserId();
    if (this.user.id === userId) {
      this.biometricService.isAvailable().then(result => {
        this.biometricAvailable = result;
      });
    }

    let loadHasSshKey: Observable<boolean>;
    if (this.canManageSshKeys) {
      loadHasSshKey = this.userService.hasSshKey(this.user.id);
    } else {
      loadHasSshKey = new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    forkJoin({
      cards: this.cardService.getCards(this.user.id),
      hasSshKey: loadHasSshKey
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(result => {
        this.cards = result.cards;
        this.hasSshKey = result.hasSshKey;
      });
  }

  navigateToUserEdit() {
    this.onNavigateToUserEdit.emit();
  }

  openDeleteUserDialog() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      data: {
        title: $localize`:@@delete user:Delete user`,
        message: $localize`:@@delete user message:Are you sure you want to delete the user "${this.user.name}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      },
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.deleteUser();
      }
    });
  }

  deleteUser() {
    this.loading = true;
    this.userService
      .deleteUser(this.user.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: _ => {
          this.snackBar.open($localize`:@@user deleted:User deleted!`, null, { duration: environment.snackDuration });
          this.onUserDeleted.emit(this.user.id);
        },
        error: _ =>
          this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
            duration: environment.snackDuration
          })
      });
  }

  onClickRegisterCard() {
    this.registeringCard = true;
    this.userService.registerCard(this.user.id).subscribe({
      error: () => {
        this.registeringCard = false;
        this.snackBar.open($localize`:@@failed register:Failed to register card!`, null, {
          duration: environment.snackDuration
        });
      }
    });
  }

  toggleCardEnabled(cardId: number) {
    const card = this.cards.find(c => c.id === cardId);
    if (card) {
      // clone the card, change the state and update
      const tmpCard = Object.assign({}, card);
      tmpCard.enabled = !card.enabled;

      this.loading = true;
      this.cardService
        .updateCard(tmpCard)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: updatedCard => (this.cards = this.cards.map(c => (c.id === updatedCard.id ? updatedCard : c))),
          error: _ =>
            this.snackBar.open($localize`:@@failed update:Failed to update!`, null, {
              duration: environment.snackDuration
            })
        });
    }
  }

  openDeleteCardDialog(cardId: number) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      data: {
        title: $localize`:@@delete card:Delete card`,
        message: $localize`:@@delete card message:Are you sure you want to delete this card?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      },
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.removeCard(cardId);
      }
    });
  }

  removeCard(cardId: number) {
    this.loading = true;
    this.cardService
      .deleteCard(cardId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: _ => {
          this.snackBar.open($localize`:@@card deleted:Card deleted!`, null, { duration: environment.snackDuration });
          this.cards = this.cards.filter(c => c.id !== cardId);
        },
        error: _ =>
          this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
            duration: environment.snackDuration
          })
      });
  }

  openDeviceRegistrationDialog() {
    const dialogRef = this.dialog.open(UserDeviceRegistrationDialogComponent, {
      width: '350px',
      data: this.user
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loading = true;
      this.userService
        .getUser(this.user.id)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(user => (this.user = user));
    });
  }

  openDeleteRegistrationCodeDialog() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      data: {
        title: $localize`:@@delete registration code:Delete registration code`,
        message: $localize`:@@delete registration code message:Are you sure you want to delete the registration code?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      },
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.removeRegistrationCode();
      }
    });
  }

  removeRegistrationCode() {
    this.loading = true;
    this.userService
      .deleteRegistrationCode(this.user.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: _ => (this.user.hasRegistrationCode = false),
        error: _ =>
          this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
            duration: environment.snackDuration
          })
      });
  }

  openSshKeySetupDialog() {
    const dialogRef = this.dialog.open(UserSshKeySetupDialogComponent, {
      width: '350px',
      data: this.user
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loading = true;
      this.userService
        .hasSshKey(this.user.id)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(hasSshKey => (this.hasSshKey = hasSshKey));
    });
  }

  openDeleteSshKeyDialog() {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      data: {
        title: $localize`:@@delete ssh key:Delete SSH key`,
        message: $localize`:@@delete ssh key message:Are you sure you want to delete the SSH key?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      },
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.removeSSHKey();
      }
    });
  }

  removeSSHKey() {
    this.loading = true;
    this.userService
      .deleteSshKey(this.user.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: _ => (this.hasSshKey = false),
        error: _ =>
          this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
            duration: environment.snackDuration
          })
      });
  }

  biometricEnabled() {
    return this.useBiometric === true || this.useBiometric === null;
  }

  enableBiometricLogin() {
    this.loading = true;
    const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
    const locationId = localStorage.getItem('selectedLocationId');

    // restore initial state when use can decide at login if biometric should be used
    status[locationId] = null;

    localStorage.setItem('biometricEnabled', JSON.stringify(status));
    this.useBiometric = null;
    this.loading = false;
  }

  disableBiometricLogin() {
    this.loading = true;
    const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
    const locationId = localStorage.getItem('selectedLocationId');
    status[locationId] = false;
    localStorage.setItem('biometricEnabled', JSON.stringify(status));
    this.useBiometric = false;
    this.loading = false;
  }
}
