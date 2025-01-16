import { Component, EventEmitter, inject, Inject, Input, OnInit, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component";

import { Card, ROLE_TYPES, User } from "@app/models";
import { CardService, EventService, UserService } from "@app/services";
import { environment } from "@environments/environment";
import { finalize, forkJoin } from "rxjs";
import { UserDeviceRegistrationDialogComponent } from "../user-device-registration/user-device-registration.component";
import { UserSshKeySetupDialogComponent } from "../user-ssh-key-setup/user-ssh-key-setup.component";


@Component({
  selector: 'user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent implements OnInit {
  @Input() user: User;

  @Input() disabled: boolean = false;

  @Input() canManageUser: boolean = false;
  @Input() canManageCards: boolean = false;
  @Input() canManageSshKeys: boolean = false;
  @Input() canManageRegistration: boolean = false;

  @Output() onUserDeleted = new EventEmitter<number>();
  @Output() onNavigateToUserEdit = new EventEmitter<void>();

  readonly roleTypes = ROLE_TYPES;

  cards: Card[] = [];
  registeringCard: boolean = false;
  hasSshKey: boolean = false;
  loading: boolean = true;

  dialog = inject(MatDialog);

  constructor(
    @Inject('CardService') private cardService: CardService,
    @Inject('EventService') private eventService: EventService,
    @Inject('UserService') private userService: UserService,

    private snackBar: MatSnackBar,
  ) {
    this.eventService.listen('card_registered')
      .subscribe(result => {
        this.registeringCard = false;
        this.snackBar.dismiss();
        if (result) {
          // registered
          this.snackBar.open($localize`:@@card registered:Card registered!`, null, { duration: environment.snackDuration });
        }
        else if (result === false) {
          // not registered
          this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, { duration: environment.snackDuration });
        }
        else if (result === null) {
          // time expired
          this.snackBar.open($localize`:@@card not registered:Failed to register!`, null, { duration: environment.snackDuration });
        }
      })
  }

  ngOnInit(): void {
    forkJoin({
      cards: this.cardService.getCards(this.user.id),
      hasSshKey: this.userService.hasSshKey(this.user.id)
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe((result) => {
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
            color: 'warn',
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
        this.deleteUser();
      }
    });
  }

  deleteUser() {
    this.loading = true;
    this.userService.deleteUser(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: _ => {
          this.snackBar.open($localize`:@@user deleted:User deleted!`, null, { duration: environment.snackDuration });
          this.onUserDeleted.emit(this.user.id);
        },
        error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
      });
  }

  onClickRegisterCard() {
    this.registeringCard = true;
    this.userService.registerCard(this.user.id).subscribe();
  }

  toggleCardEnabled(cardId: number) {
    this.cards.forEach((card) => {
      if (card.id === cardId) {
        // clone the card, change the state and update
        let tmpCard = Object.assign({}, card)
        tmpCard.enabled = !card.enabled;

        this.loading = true;
        this.cardService.updateCard(tmpCard)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: _ => this.cardService.getCards(this.user.id).subscribe(cards => this.cards = cards),
            error: _ => this.snackBar.open($localize`:@@failed update:Failed to update!`, null, { duration: environment.snackDuration })
          });
      }
    });
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
            color: 'warn',
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
    this.cardService.deleteCard(cardId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: _ => {
          this.snackBar.open($localize`:@@card deleted:Card deleted!`, null, { duration: environment.snackDuration });
          this.cardService.getCards(this.user.id).subscribe(cards => this.cards = cards);
        },
        error: _ =>
          this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
      });
  }


  openDeviceRegistrationDialog() {
    const dialogRef = this.dialog.open(UserDeviceRegistrationDialogComponent, {
      width: '350px',
      data: this.user,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loading = true;
      this.userService.getUser(this.user.id)
        .pipe(finalize(() => this.loading = false))
        .subscribe(user => this.user = user);
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
            color: 'warn',
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
    this.userService.deleteRegistrationCode(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: _ => this.user.hasRegistrationCode = false,
        error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration }),
      });
  }

  openSshKeySetupDialog() {
    const dialogRef = this.dialog.open(UserSshKeySetupDialogComponent, {
      width: '350px',
      data: this.user,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loading = true;
      this.userService.hasSshKey(this.user.id)
        .pipe(finalize(() => this.loading = false))
        .subscribe(hasSshKey => this.hasSshKey = hasSshKey);
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
            color: 'warn',
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
    this.userService.deleteSshKey(this.user.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: _ => this.hasSshKey = false,
        error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration }),
      });
  }
}
